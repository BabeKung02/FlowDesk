import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/database.js";
import { generateOTP, sendOTPEmail } from "./email.service.js";

const normalize = (email) => email.toLowerCase();

const createOTPData = (purpose) => ({
  otpCode: generateOTP(),
  otpExpires: new Date(Date.now() + 10 * 60 * 1000),
  otpPurpose: purpose,
});

const clearOTP = { otpCode: null, otpExpires: null, otpPurpose: null };

const createError = (message, status) =>
  Object.assign(new Error(message), { status });

// ── JWT Helpers ───────────────────────────────────────
const generateAuthTokens = (user) => {
  const payload = { id: user.user_id, email: user.email };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
};

// ── RefreshToken Helpers ──────────────────────────────
// hash ก่อนบันทึก — ถ้า DB หลุด ใช้ค่านี้ตรงๆ ไม่ได้
const hashToken = (token) => bcrypt.hash(token, 10);

// เปรียบเทียบ token กับ hash ใน DB
const verifyTokenHash = (token, hash) => bcrypt.compare(token, hash);

// บันทึก refreshToken ใหม่ลงตาราง refresh_tokensy
const saveRefreshToken = async (userId, rawToken) => {
  const tokenHash = await hashToken(rawToken);

  // คำนวณ expiresAt จาก env เช่น "7d" → 7 วันจากนี้
  const days = parseInt(process.env.JWT_REFRESH_EXPIRES_IN ?? "7");
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  return prisma.refreshToken.create({
    data: { tokenHash, userId, expiresAt },
  });
};

// ── Register ──────────────────────────────────────────
const register = async ({ firstName, lastName, email, password }) => {
  const normalizedEmail = normalize(email);
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing?.isVerified) throw createError("อีเมลนี้ถูกใช้งานแล้ว", 409);

  const otpData = createOTPData("VERIFY_EMAIL");

  if (existing) {
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: otpData,
    });
  } else {
    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: { firstName, lastName, email: normalizedEmail, password: hashed, ...otpData },
    });
  }

  await sendOTPEmail(normalizedEmail, otpData.otpCode, "VERIFY_EMAIL");
  return {
    message: "สมัครสมาชิกสำเร็จ กรุณาตรวจสอบอีเมลของคุณ",
    otpExpires: otpData.otpExpires,
  };
};

// ── Verify Email ──────────────────────────────────────
const verifyEmail = async ({ email, otp }) => {
  const normalizedEmail = normalize(email);
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) throw createError("ไม่พบผู้ใช้งาน", 404);
  if (user.otpExpires < new Date()) throw createError("รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่", 400);
  if (user.otpPurpose !== "VERIFY_EMAIL" || user.otpCode !== otp) throw createError("รหัส OTP ไม่ถูกต้อง", 400);

  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { isVerified: true, ...clearOTP },
  });

  return { message: "ยืนยันอีเมลสำเร็จ" };
};

// ── Login ─────────────────────────────────────────────
const login = async ({ email, password }) => {
  const normalizedEmail = normalize(email);
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) throw createError("อีเมลหรือรหัสผ่านไม่ถูกต้อง", 401);
  if (!user.isVerified) throw createError("กรุณายืนยันอีเมลของคุณด้วยรหัส OTP ก่อนเข้าสู่ระบบ", 403);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw createError("อีเมลหรือรหัสผ่านไม่ถูกต้อง", 401);

  const { accessToken, refreshToken } = generateAuthTokens(user);

  // บันทึก token ใหม่ลงตาราง refresh_tokens (ไม่ลบเก่า = รองรับหลาย device)
  await saveRefreshToken(user.user_id, refreshToken);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.user_id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
  };
};

// ── Forgot Password ───────────────────────────────────
const forgotPassword = async ({ email }) => {
  const normalizedEmail = normalize(email);
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // ไม่บอกว่าเจอหรือไม่เจอ ป้องกัน user enumeration attack
  if (!user) return { message: "หากอีเมลนี้มีในระบบ รหัส OTP จะถูกส่งไปยังอีเมลของคุณ" };

  const otpData = createOTPData("FORGOT_PASSWORD");
  await prisma.user.update({ where: { email: normalizedEmail }, data: otpData });
  await sendOTPEmail(normalizedEmail, otpData.otpCode, "FORGOT_PASSWORD");

  return { message: "หากอีเมลนี้มีในระบบ รหัส OTP จะถูกส่งไปยังอีเมลของคุณ" };
};

// ── Reset Password ────────────────────────────────────
const resetPassword = async ({ email, otp, newPassword }) => {
  const normalizedEmail = normalize(email);
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) throw createError("คำขอไม่ถูกต้อง", 400);
  if (user.otpExpires < new Date()) throw createError("รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่", 400);
  if (user.otpPurpose !== "FORGOT_PASSWORD" || user.otpCode !== otp) throw createError("รหัส OTP ไม่ถูกต้อง", 400);

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { password: hashed, ...clearOTP },
  });

  return { message: "เปลี่ยนรหัสผ่านสำเร็จ" };
};

// ── Change Password ───────────────────────────────────
const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { user_id: userId } });
  if (!user) throw createError("ไม่พบผู้ใช้งาน", 404);

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw createError("รหัสผ่านปัจจุบันไม่ถูกต้อง", 400);

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { user_id: userId }, data: { password: hashed } });

  return { message: "เปลี่ยนรหัสผ่านสำเร็จ" };
};

// ── Resend OTP ────────────────────────────────────────
const resendOTP = async ({ email }) => {
  const normalizedEmail = normalize(email);
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) throw createError("ไม่พบผู้ใช้งาน", 404);
  if (user.isVerified) throw createError("อีเมลนี้ยืนยันแล้ว", 400);

  const otpData = createOTPData("VERIFY_EMAIL");
  await prisma.user.update({ where: { email: normalizedEmail }, data: { ...otpData } });
  await sendOTPEmail(normalizedEmail, otpData.otpCode, "VERIFY_EMAIL");

  return { message: "ส่งรหัส OTP ใหม่แล้ว กรุณาตรวจสอบอีเมล", otpExpires: otpData.otpExpires };
};

// ── Get OTP Status ────────────────────────────────────
const getOTPStatus = async ({ email }) => {
  const normalizedEmail = normalize(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { otpExpires: true, otpPurpose: true, isVerified: true },
  });

  if (!user) throw createError("ไม่พบผู้ใช้งาน", 404);
  if (user.isVerified) throw createError("อีเมลนี้ยืนยันแล้ว", 400);
  if (!user.otpExpires) throw createError("ไม่มี OTP ที่ใช้งานได้", 400);

  const remainingSeconds = Math.floor((new Date(user.otpExpires).getTime() - Date.now()) / 1000);
  return {
    remainingSeconds: remainingSeconds > 0 ? remainingSeconds : 0,
    isExpired: remainingSeconds <= 0,
  };
};

// ── Verify Forgot OTP ─────────────────────────────────
const verifyForgotOTP = async ({ email, otp }) => {
  const normalizedEmail = normalize(email);
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) throw createError("รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอรหัสใหม่", 400);
  if (user.otpExpires < new Date()) throw createError("รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่", 400);
  if (user.otpPurpose !== "FORGOT_PASSWORD" || user.otpCode !== otp) throw createError("รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอรหัสใหม่", 400);

  return { message: "ยืนยัน OTP สำเร็จ" };
};

// ── Refresh Token ─────────────────────────────────────
const refreshToken = async ({ refreshToken: rawToken }) => {
  if (!rawToken) throw createError("ไม่พบ Refresh Token", 401);

  // 1. verify signature และ expiry ก่อน
  let payload;
  try {
    payload = jwt.verify(rawToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw createError("Refresh Token ไม่ถูกต้องหรือหมดอายุแล้ว", 401);
  }

  // 2. หา token records ของ user นี้ที่ยังไม่ถูก revoke และยังไม่หมดอายุ
  const tokenRecords = await prisma.refreshToken.findMany({
    where: {
      userId: payload.id,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!tokenRecords.length) throw createError("Refresh Token ไม่ถูกต้อง", 401);

  // 3. เปรียบเทียบ rawToken กับทุก hash ที่มี (รองรับหลาย device)
  let matchedRecord = null;
  for (const record of tokenRecords) {
    const isMatch = await verifyTokenHash(rawToken, record.tokenHash);
    if (isMatch) { matchedRecord = record; break; }
  }

  if (!matchedRecord) throw createError("Refresh Token ไม่ถูกต้อง", 401);

  // 4. ออก accessToken ใหม่
  const user = await prisma.user.findUnique({ where: { user_id: payload.id } });
  const accessToken = jwt.sign(
    { id: user.user_id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return { accessToken };
};

// ── Logout (เครื่องนี้เท่านั้น) ───────────────────────
const logout = async ({ userId, rawToken }) => {
  if (!rawToken) throw createError("ไม่พบ Refresh Token", 400);

  // หา records ทั้งหมดของ user นี้
  const tokenRecords = await prisma.refreshToken.findMany({
    where: { userId, revokedAt: null },
  });

  // เปรียบเทียบเพื่อหา record ที่ตรงกับ token ของเครื่องนี้
  for (const record of tokenRecords) {
    const isMatch = await verifyTokenHash(rawToken, record.tokenHash);
    if (isMatch) {
      await prisma.refreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date() },
      });
      break;
    }
  }

  return { message: "ออกจากระบบสำเร็จ" };
};

// ── Logout All Devices ────────────────────────────────
const logoutAll = async ({ userId }) => {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return { message: "ออกจากระบบทุกอุปกรณ์สำเร็จ" };
};

export default {
  register, verifyEmail, login,
  forgotPassword, resetPassword, changePassword,
  resendOTP, getOTPStatus, verifyForgotOTP,
  refreshToken, logout, logoutAll,
};
