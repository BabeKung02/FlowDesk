import prisma from "../config/database.js";

// ── Stats ─────────────────────────────────────────────
// จำนวน request แยกตาม status + รวมทั้งหมด
// USER เห็นแค่ของตัวเอง / ADMIN-MANAGER เห็นทั้งระบบ
const getStats = async ({ user }) => {
  const where = user.role === "USER" ? { requesterId: user.user_id } : {};

  const [total, pending, approved, rejected, cancelled] = await Promise.all([
    prisma.request.count({ where }),
    prisma.request.count({ where: { ...where, status: "PENDING" } }),
    prisma.request.count({ where: { ...where, status: "APPROVED" } }),
    prisma.request.count({ where: { ...where, status: "REJECTED" } }),
    prisma.request.count({ where: { ...where, status: "CANCELLED" } }),
  ]);

  return {
    total,
    pending,
    approved,
    rejected,
    cancelled,
  };
};

// ── Recent Activity ───────────────────────────────────
// กิจกรรมล่าสุด 10 รายการ
const getRecent = async ({ user }) => {
  const where = user.role === "USER" ? { requesterId: user.user_id } : {};

  const requests = await prisma.request.findMany({
    where,
    take: 10,
    orderBy: { updatedAt: "desc" },
    include: {
      requester: {
        select: { firstName: true, lastName: true, email: true },
      },
      approver: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  return requests;
};

// ── Monthly Trend ──────────────────────────────────────
// จำนวน request รายเดือนย้อนหลัง 6 เดือน (สำหรับ Bar Chart)
const getMonthlyTrend = async ({ user }) => {
  const where = user.role === "USER" ? { requesterId: user.user_id } : {};

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const requests = await prisma.request.findMany({
    where: { ...where, createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true, status: true },
  });

  // จัดกลุ่มตามเดือน
  const monthMap = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap[key] = { month: key, total: 0, approved: 0, rejected: 0 };
  }

  requests.forEach(({ createdAt, status }) => {
    const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (monthMap[key]) {
      monthMap[key].total++;
      if (status === "APPROVED") monthMap[key].approved++;
      if (status === "REJECTED") monthMap[key].rejected++;
    }
  });

  return Object.values(monthMap);
};

export default { getStats, getRecent, getMonthlyTrend };
