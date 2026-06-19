import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import * as ctrl from "../controllers/request.controller.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Requests
 *   description: Request management
 */

/**
 * @swagger
 * /api/requests:
 *   get:
 *     tags: [Requests]
 *     summary: ดูรายการ request (USER เห็นแค่ของตัวเอง)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, CANCELLED]
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: รายการ request พร้อม pagination
 */
router.get("/", ctrl.getAll);

/**
 * @swagger
 * /api/requests:
 *   post:
 *     tags: [Requests]
 *     summary: สร้าง request ใหม่
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RequestBody'
 *     responses:
 *       201:
 *         description: สร้างสำเร็จ
 */
router.post("/", ctrl.create);

/**
 * @swagger
 * /api/requests/{id}:
 *   get:
 *     tags: [Requests]
 *     summary: ดู request เดี่ยว
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: ข้อมูล request
 *       404:
 *         description: ไม่พบ request
 */
router.get("/:id", ctrl.getOne);

/**
 * @swagger
 * /api/requests/{id}:
 *   patch:
 *     tags: [Requests]
 *     summary: แก้ไข request (เฉพาะเจ้าของ และสถานะ PENDING)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RequestBody'
 *     responses:
 *       200:
 *         description: แก้ไขสำเร็จ
 */
router.patch("/:id", ctrl.update);

/**
 * @swagger
 * /api/requests/{id}/cancel:
 *   patch:
 *     tags: [Requests]
 *     summary: ยกเลิก request
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: ยกเลิกสำเร็จ
 */
router.patch("/:id/cancel", ctrl.cancel);

/**
 * @swagger
 * /api/requests/{id}/approve:
 *   patch:
 *     tags: [Requests]
 *     summary: อนุมัติ request (ADMIN, MANAGER เท่านั้น)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApprovalBody'
 *     responses:
 *       200:
 *         description: อนุมัติสำเร็จ พร้อมส่ง email แจ้ง requester
 *       403:
 *         description: ไม่มีสิทธิ์
 */
router.patch("/:id/approve", requireRole("ADMIN", "MANAGER"), ctrl.approve);

/**
 * @swagger
 * /api/requests/{id}/reject:
 *   patch:
 *     tags: [Requests]
 *     summary: ปฏิเสธ request (ADMIN, MANAGER เท่านั้น)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApprovalBody'
 *     responses:
 *       200:
 *         description: ปฏิเสธสำเร็จ พร้อมส่ง email แจ้ง requester
 */
router.patch("/:id/reject", requireRole("ADMIN", "MANAGER"), ctrl.reject);

export default router;
