import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import * as ctrl from "../controllers/announcement.controller.js";

const router = Router();

// ทุก route ต้องเป็น ADMIN เท่านั้น
router.use(authenticate, requireRole("ADMIN"));

/**
 * @swagger
 * tags:
 *   name: Announcements
 *   description: ประกาศข่าวสารบริษัท (ADMIN only) — broadcast ผ่าน RabbitMQ
 */

/**
 * @swagger
 * /api/announcements:
 *   post:
 *     tags: [Announcements]
 *     summary: สร้างประกาศและส่ง email ให้ user ทุกคนที่ verified
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, message]
 *             properties:
 *               title:   { type: string, example: "ประกาศวันหยุดบริษัท" }
 *               message: { type: string, example: "บริษัทจะหยุดทำการในวันที่..." }
 *     responses:
 *       201:
 *         description: สร้างประกาศสำเร็จ และ publish เข้า queue ให้ user ทุกคนแล้ว
 */
router.post("/", ctrl.create);

/**
 * @swagger
 * /api/announcements:
 *   get:
 *     tags: [Announcements]
 *     summary: ดูประวัติประกาศทั้งหมด
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: รายการประกาศพร้อม pagination
 */
router.get("/", ctrl.getAll);

export default router;
