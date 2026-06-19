import prisma from "../config/database.js";
import { publishNotification } from "./queue.service.js";

const createError = (message, status = 400) =>
  Object.assign(new Error(message), { status });

// ── Create & Broadcast Announcement ───────────────────
const create = async ({ body, user }) => {
  const { title, message } = body;

  if (!title?.trim()) throw createError("กรุณากรอกหัวข้อประกาศ");
  if (!message?.trim()) throw createError("กรุณากรอกรายละเอียดประกาศ");

  // ดึง user ทุกคนที่ verified แล้ว (ไม่ส่งให้คนที่ยังไม่ verify email)
  const recipients = await prisma.user.findMany({
    where: { isVerified: true },
    select: { user_id: true, email: true },
  });

  // บันทึก announcement ก่อน เพื่อมี record ไว้อ้างอิง
  const announcement = await prisma.announcement.create({
    data: {
      title: title.trim(),
      message: message.trim(),
      createdBy: user.user_id,
      recipientCount: recipients.length,
    },
  });

  // publish เข้า queue ทีละคน — ไม่ await ทีละตัว เพื่อไม่ block
  // แต่ละ message แยกกัน ถ้าส่งคนหนึ่งล้มเหลว ไม่กระทบคนอื่น
  let publishedCount = 0;
  for (const recipient of recipients) {
    const success = publishNotification({
      type: "ANNOUNCEMENT",
      userId: recipient.user_id,
      to: recipient.email,
      title: announcement.title,
      announcementMessage: announcement.message,
    });
    if (success) publishedCount++;
  }

  return {
    announcement,
    totalRecipients: recipients.length,
    published: publishedCount,
  };
};

// ── Get All Announcements (history) ───────────────────
const getAll = async ({ query }) => {
  const { page = 1, limit = 10 } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const [data, total] = await Promise.all([
    prisma.announcement.findMany({
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.announcement.count(),
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

export default { create, getAll };
