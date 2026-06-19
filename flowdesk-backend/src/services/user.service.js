import prisma from "../config/database.js";
import bcrypt from "bcryptjs";

const createError = (message, status = 400) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const SAFE_USER_SELECT = {
  user_id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
};

// ── Get All Users (ADMIN only) ────────────────────────
const getAll = async ({ query }) => {
  const { role, search, page = 1, limit = 10 } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName:  { contains: search, mode: "insensitive" } },
      { email:     { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      select: SAFE_USER_SELECT,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

// ── Get One User ──────────────────────────────────────
const getOne = async ({ id }) => {
  const user = await prisma.user.findUnique({
    where: { user_id: id },
    select: SAFE_USER_SELECT,
  });
  if (!user) throw createError("ไม่พบผู้ใช้งาน", 404);
  return user;
};

// ── Update User Role (ADMIN only) ─────────────────────
const updateRole = async ({ id, body, adminId }) => {
  if (id === adminId) throw createError("ไม่สามารถเปลี่ยน role ของตัวเองได้");

  const user = await prisma.user.findUnique({ where: { user_id: id } });
  if (!user) throw createError("ไม่พบผู้ใช้งาน", 404);

  const validRoles = ["ADMIN", "MANAGER", "USER"];
  if (!validRoles.includes(body.role)) throw createError("Role ไม่ถูกต้อง");

  return prisma.user.update({
    where: { user_id: id },
    data: { role: body.role },
    select: SAFE_USER_SELECT,
  });
};

// ── Toggle Verified (ADMIN only) ──────────────────────
// ใช้ suspend user โดยการ set isVerified = false
const toggleVerified = async ({ id, adminId }) => {
  if (id === adminId) throw createError("ไม่สามารถ suspend ตัวเองได้");

  const user = await prisma.user.findUnique({ where: { user_id: id } });
  if (!user) throw createError("ไม่พบผู้ใช้งาน", 404);

  return prisma.user.update({
    where: { user_id: id },
    data: { isVerified: !user.isVerified },
    select: SAFE_USER_SELECT,
  });
};

// ── Delete User (ADMIN only) ──────────────────────────
const deleteUser = async ({ id, adminId }) => {
  if (id === adminId) throw createError("ไม่สามารถลบตัวเองได้");

  const user = await prisma.user.findUnique({ where: { user_id: id } });
  if (!user) throw createError("ไม่พบผู้ใช้งาน", 404);

  await prisma.user.delete({ where: { user_id: id } });
  return { message: "ลบผู้ใช้งานสำเร็จ" };
};

export default { getAll, getOne, updateRole, toggleVerified, deleteUser };
