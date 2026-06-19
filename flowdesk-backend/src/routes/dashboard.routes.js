import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import * as ctrl from "../controllers/dashboard.controller.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard statistics
 */

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: สถิติ request แยกตาม status
 *     responses:
 *       200:
 *         description: จำนวน total, pending, approved, rejected, cancelled
 */
router.get("/stats", ctrl.getStats);

/**
 * @swagger
 * /api/dashboard/recent:
 *   get:
 *     tags: [Dashboard]
 *     summary: กิจกรรมล่าสุด 10 รายการ
 *     responses:
 *       200:
 *         description: รายการ request ล่าสุดพร้อมข้อมูล requester และ approver
 */
router.get("/recent", ctrl.getRecent);

/**
 * @swagger
 * /api/dashboard/monthly-trend:
 *   get:
 *     tags: [Dashboard]
 *     summary: Trend รายเดือนย้อนหลัง 6 เดือน
 *     responses:
 *       200:
 *         description: ข้อมูลสำหรับ Bar Chart แยก total, approved, rejected ต่อเดือน
 */
router.get("/monthly-trend", ctrl.getMonthlyTrend);

export default router;
