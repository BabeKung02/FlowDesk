import "dotenv/config";
import prisma from "../config/database.js";
import { sendApprovalEmail, sendAnnouncementEmail } from "./email.service.js";
import { connectQueue, consumeNotifications } from "./queue.service.js";

// ── Handler ───────────────────────────────────────────
// รับ message จาก queue แล้วส่ง email + บันทึก history
// แยกตาม payload.type เพราะ email template ต่างกันคนละแบบ
const handleNotification = async (payload) => {
  if (payload.type === "ANNOUNCEMENT") {
    await handleAnnouncement(payload);
  } else {
    // APPROVED / REJECTED
    await handleApproval(payload);
  }
};

// ── Approval / Rejection ──────────────────────────────
const handleApproval = async (payload) => {
  const { userId, requestId, to, requesterName, title, type, note } = payload;

  let status = "SENT";
  const message = `${type === "APPROVED" ? "อนุมัติ" : "ปฏิเสธ"} คำขอ: ${title}`;

  try {
    await sendApprovalEmail({ to, requesterName, title, status: type, note });
    console.log(`✅ Approval email sent to ${to} — ${type}`);
  } catch (err) {
    status = "FAILED";
    console.error(`❌ Approval email failed to ${to}:`, err.message);
  }

  await prisma.notificationHistory.create({
    data: { userId, requestId, type, message, channel: "EMAIL", status },
  });
};

// ── Announcement ──────────────────────────────────────
// ไม่มี requestId เพราะไม่เกี่ยวกับ request ใดๆ
const handleAnnouncement = async (payload) => {
  const { userId, to, title, announcementMessage } = payload;

  let status = "SENT";

  try {
    await sendAnnouncementEmail({ to, title, message: announcementMessage });
    console.log(`✅ Announcement email sent to ${to}`);
  } catch (err) {
    status = "FAILED";
    console.error(`❌ Announcement email failed to ${to}:`, err.message);
  }

  await prisma.notificationHistory.create({
    data: {
      userId,
      requestId: null,
      type: "ANNOUNCEMENT",
      message: `ประกาศ: ${title}`,
      channel: "EMAIL",
      status,
    },
  });
};

// ── Start Worker ──────────────────────────────────────
const startWorker = async () => {
  console.log("🚀 Notification worker starting...");
  await connectQueue();
  await consumeNotifications(handleNotification);
};

startWorker();
