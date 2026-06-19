import prisma from "../config/database.js";
import { publishNotification } from "./queue.service.js";

const createError = (message, status = 400) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// ── Get All Requests ──────────────────────────────────
// USER เห็นแค่ request ของตัวเอง
// ADMIN / MANAGER เห็นทั้งหมด + filter ได้
const getAll = async ({ user, query }) => {
  const { status, type, page = 1, limit = 10 } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {};

  // USER เห็นแค่ของตัวเอง
  if (user.role === "USER") {
    where.requesterId = user.user_id;
  }

  if (status) where.status = status;
  if (type) where.type = { contains: type, mode: "insensitive" };

  const [data, total] = await Promise.all([
    prisma.request.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      include: {
        requester: {
          select: { user_id: true, firstName: true, lastName: true, email: true },
        },
      },
    }),
    prisma.request.count({ where }),
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

// ── Get One Request ───────────────────────────────────
const getOne = async ({ id, user }) => {
  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      requester: {
        select: { user_id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  if (!request) throw createError("ไม่พบคำขอนี้", 404);

  // USER เข้าถึงได้แค่ request ของตัวเอง
  if (user.role === "USER" && request.requesterId !== user.user_id) {
    throw createError("คุณไม่มีสิทธิ์เข้าถึงคำขอนี้", 403);
  }

  return request;
};

// ── Create Request ────────────────────────────────────
const create = async ({ body, user }) => {
  const { title, description, type } = body;

  if (!title?.trim()) throw createError("กรุณากรอกหัวข้อคำขอ");
  if (!type?.trim()) throw createError("กรุณาระบุประเภทคำขอ");

  const request = await prisma.request.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      type: type.trim(),
      requesterId: user.user_id,
    },
    include: {
      requester: {
        select: { user_id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  return request;
};

// ── Update Request ────────────────────────────────────
// แก้ได้แค่ตัวเอง และแค่ตอน PENDING เท่านั้น
const update = async ({ id, body, user }) => {
  const request = await prisma.request.findUnique({ where: { id } });

  if (!request) throw createError("ไม่พบคำขอนี้", 404);
  if (request.requesterId !== user.user_id) throw createError("คุณไม่มีสิทธิ์แก้ไขคำขอนี้", 403);
  if (request.status !== "PENDING") throw createError("ไม่สามารถแก้ไขคำขอที่ดำเนินการแล้ว");

  const { title, description, type } = body;

  const updated = await prisma.request.update({
    where: { id },
    data: {
      ...(title && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(type && { type: type.trim() }),
    },
    include: {
      requester: {
        select: { user_id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  return updated;
};

// ── Cancel Request ────────────────────────────────────
// User ยกเลิกเองได้ตอน PENDING / ADMIN ยกเลิกได้เสมอ
const cancel = async ({ id, user }) => {
  const request = await prisma.request.findUnique({ where: { id } });

  if (!request) throw createError("ไม่พบคำขอนี้", 404);

  const isOwner = request.requesterId === user.user_id;
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isAdmin) throw createError("คุณไม่มีสิทธิ์ยกเลิกคำขอนี้", 403);
  if (request.status !== "PENDING") throw createError("ไม่สามารถยกเลิกคำขอที่ดำเนินการแล้ว");

  return prisma.request.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
};

// ── Approve Request ──────────────────────────────────
// เฉพาะ ADMIN / MANAGER เท่านั้น
const approve = async ({ id, body, user }) => {
  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      requester: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  });

  if (!request) throw createError("ไม่พบคำขอนี้", 404);
  if (request.status !== "PENDING") throw createError("คำขอนี้ได้รับการดำเนินการแล้ว");

  const updated = await prisma.request.update({
    where: { id },
    data: {
      status: "APPROVED",
      approverId: user.user_id,
      approvedAt: new Date(),
      note: body.note?.trim() || null,
    },
  });

  // publish ไปยัง RabbitMQ queue แทนส่ง email ตรงๆ
  // ทำให้ approve ตอบ response ทันที ไม่ต้องรอ email
  publishNotification({
    userId: request.requesterId,
    requestId: id,
    to: request.requester.email,
    requesterName: `${request.requester.firstName} ${request.requester.lastName}`,
    title: request.title,
    type: "APPROVED",
    note: body.note,
  });

  return updated;
};

// ── Reject Request ────────────────────────────────────
// เฉพาะ ADMIN / MANAGER เท่านั้น
const reject = async ({ id, body, user }) => {
  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      requester: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  });

  if (!request) throw createError("ไม่พบคำขอนี้", 404);
  if (request.status !== "PENDING") throw createError("คำขอนี้ได้รับการดำเนินการแล้ว");

  const updated = await prisma.request.update({
    where: { id },
    data: {
      status: "REJECTED",
      approverId: user.user_id,
      approvedAt: new Date(),
      note: body.note?.trim() || null,
    },
  });

  publishNotification({
    userId: request.requesterId,
    requestId: id,
    to: request.requester.email,
    requesterName: `${request.requester.firstName} ${request.requester.lastName}`,
    title: request.title,
    type: "REJECTED",
    note: body.note,
  });

  return updated;
};

export default { getAll, getOne, create, update, cancel, approve, reject };
