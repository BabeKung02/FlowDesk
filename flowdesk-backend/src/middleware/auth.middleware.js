import jwt from "jsonwebtoken";
import prisma from "../config/database.js";

// ── authenticate ─────────────────────────────────────
// ตรวจสอบ JWT และดึง user จาก DB เพื่อให้ได้ role ที่เป็นปัจจุบันเสมอ
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res.status(401).json({ success: false, message: "ไม่พบ Token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // ดึง role จาก DB แทนการเก็บใน JWT
    // เพราะถ้าเปลี่ยน role ใน DB แล้ว JWT เดิมจะยังมี role เก่าอยู่
    const user = await prisma.user.findUnique({
      where: { user_id: payload.id },
      select: { user_id: true, email: true, role: true, isVerified: true },
    });

    if (!user)
      return res.status(401).json({ success: false, message: "ไม่พบผู้ใช้งาน" });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Token ไม่ถูกต้องหรือหมดอายุ" });
  }
};

// ── requireRole ──────────────────────────────────────
// ใช้ต่อจาก authenticate เสมอ
// ตัวอย่าง: router.delete('/users/:id', authenticate, requireRole('ADMIN'), ctrl.deleteUser)
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้",
    });
  }
  next();
};

export { authenticate, requireRole };
