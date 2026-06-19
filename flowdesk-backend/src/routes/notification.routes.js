import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import * as ctrl from "../controllers/notification.controller.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification history (audit log จาก RabbitMQ worker)
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: ดูประวัติการส่ง notification (USER เห็นแค่ของตัวเอง)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SENT, FAILED]
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *         description: (ADMIN/MANAGER เท่านั้น) ดูของ user คนอื่น
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: รายการ notification history พร้อม pagination
 */
router.get("/", ctrl.getAll);

export default router;
