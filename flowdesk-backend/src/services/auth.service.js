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

// ── Helper สำหรับสร้างตั๋วคู่ ──────────────────────────
const generateAuthTokens = (user) => {
  // ใช้ user_id ให้ตรงตาม Schema ของเรา
  const payload = { id: user.user_id, email: user.email }; 

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
};

// ── Register ─────────────────────────────────────────
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
      data: {
        firstName,
        lastName,
        email: normalizedEmail,
        password: hashed,
        ...otpData,
      },
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
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) throw createError("ไม่พบผู้ใช้งาน", 404);
  if (user.otpExpires < new Date())
    throw createError("รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่", 400);
  if (user.otpPurpose !== "VERIFY_EMAIL" || user.otpCode !== otp)
    throw createError("รหัส OTP ไม่ถูกต้อง", 400);

  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { isVerified: true, ...clearOTP },
  });

  return { message: "ยืนยันอีเมลสำเร็จ" };
};

// ── Login (แก้ไขเพิ่มฟีเจอร์ตั๋วคู่และบันทึก DB แล้ว) ────────────
const login = async ({ email, password }) => {
  const normalizedEmail = normalize(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) throw createError("อีเมลหรือรหัสผ่านไม่ถูกต้อง", 401);
  if (!user.isVerified)
    throw createError(
      "กรุณายืนยันอีเมลของคุณด้วยรหัส OTP ก่อนเข้าสู่ระบบ",
      403,
    );

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw createError("อีเมลหรือรหัสผ่านไม่ถูกต้อง", 401);

  // 🔥 1. เรียกใช้งานฟังก์ชันเจนโทเคนคู่ที่สร้างไว้ด้านบน
  const { accessToken, refreshToken } = generateAuthTokens(user);

  // 💾 2. บันทึก Refresh Token ตัวล่าสุดนี้ลงคอลัมน์ใหม่ในตาราง users ของ PostgreSQL
  await prisma.user.update({
    where: { user_id: user.user_id },
    data: { refreshToken: refreshToken },
  });

  // 🏎️ 3. ส่งกลับหน้าบ้านให้ครบถ้วนทั้งสองใบ
  return {
    accessToken,
    refreshToken,
    user: {
      id: user.user_id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
  };
};

// ── Forgot Password ───────────────────────────────────
const forgotPassword = async ({ email }) => {
  const normalizedEmail = normalize(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user)
    return { message: "หากอีเมลนี้มีในระบบ รหัส OTP จะถูกส่งไปยังอีเมลของคุณ" };

  const otpData = createOTPData("FORGOT_PASSWORD");
  await prisma.user.update({
    where: { email: normalizedEmail },
    data: otpData,
  });

  await sendOTPEmail(normalizedEmail, otpData.otpCode, "FORGOT_PASSWORD");
  return { message: "หากอีเมลนี้มีในระบบ รหัส OTP จะถูกส่งไปยังอีเมลของคุณ" };
};

// ── Reset Password ────────────────────────────────────
const resetPassword = async ({ email, otp, newPassword }) => {
  const normalizedEmail = normalize(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) throw createError("คำขอไม่ถูกต้อง", 400);
  if (user.otpExpires < new Date())
    throw createError("รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่", 400);
  if (user.otpPurpose !== "FORGOT_PASSWORD" || user.otpCode !== otp)
    throw createError("รหัส OTP ไม่ถูกต้อง", 400);

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { password: hashed, ...clearOTP },
  });

  return { message: "เปลี่ยนรหัสผ่านสำเร็จ" };
};

// ── Change Password (แก้ไขคีย์ไอดีเป็น user_id แล้ว) ──────────
const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { user_id: userId } });
  if (!user) throw createError("ไม่พบผู้ใช้งาน", 404);

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw createError("รหัสผ่านปัจจุบันไม่ถูกต้อง", 400);

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { user_id: userId },
    data: { password: hashed },
  });

  return { message: "เปลี่ยนรหัสผ่านสำเร็จ" };
};

const resendOTP = async ({ email }) => {
  const normalizedEmail = normalize(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) throw createError("ไม่พบผู้ใช้งาน", 404);
  if (user.isVerified) throw createError("อีเมลนี้ยืนยันแล้ว", 400);

  const otpData = createOTPData("VERIFY_EMAIL");
  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { otpData },
  });

  await sendOTPEmail(normalizedEmail, otpData.otpCode, "VERIFY_EMAIL");
  return {
    message: "ส่งรหัส OTP ใหม่แล้ว กรุณาตรวจสอบอีเมล",
    otpExpires: otpData.otpExpires,
  };
};

const getOTPStatus = async ({ email }) => {
  const normalizedEmail = normalize(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { otpExpires: true, otpPurpose: true, isVerified: true }
  });

  if (!user) throw createError("ไม่พบผู้ใช้งาน", 404);
  if (user.isVerified) throw createError("อีเมลนี้ยืนยันแล้ว", 400);
  if (!user.otpExpires) throw createError("ไม่มี OTP ที่ใช้งานได้", 400);

  const remainingSeconds = Math.floor(
    (new Date(user.otpExpires).getTime() - Date.now()) / 1000
  );

  return {
    remainingSeconds: remainingSeconds > 0 ? remainingSeconds : 0,
    isExpired: remainingSeconds <= 0,
  };
};

const verifyForgotOTP = async ({ email, otp }) => {
  const normalizedEmail = normalize(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) throw createError("ไม่พบผู้ใช้งาน", 404);
  if (user.otpExpires < new Date())
    throw createError("รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่", 400);
  if (user.otpPurpose !== "FORGOT_PASSWORD" || user.otpCode !== otp)
    throw createError("รหัส OTP ไม่ถูกต้อง", 400);

  return { message: "ยืนยัน OTP สำเร็จ" };
};

export default {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  resendOTP,
  getOTPStatus,
  verifyForgotOTP
};