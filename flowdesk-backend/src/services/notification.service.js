import prisma from "../config/database.js";

// ── Get My Notifications ──────────────────────────────
// USER เห็นแค่ของตัวเอง / ADMIN เห็นทั้งหมด + filter by userId ได้
const getAll = async ({ user, query }) => {
  const { status, page = 1, limit = 10, userId } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {};

  if (user.role === "USER") {
    where.userId = user.user_id;
  } else if (userId) {
    // ADMIN/MANAGER ดู notification ของ user คนอื่นได้ผ่าน query param
    where.userId = userId;
  }

  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.notificationHistory.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { sentAt: "desc" },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    }),
    prisma.notificationHistory.count({ where }),
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

export default { getAll };
