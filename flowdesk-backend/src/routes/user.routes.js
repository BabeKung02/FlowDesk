import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import * as ctrl from "../controllers/user.controller.js";

const router = Router();
router.use(authenticate, requireRole("ADMIN"));

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (ADMIN only)
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: ดูรายชื่อ user ทั้งหมด
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, MANAGER, USER]
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: ค้นหาจากชื่อหรืออีเมล
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: รายชื่อ user พร้อม pagination
 */
router.get("/", ctrl.getAll);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: ดู user คนเดียว
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: ข้อมูล user
 *       404:
 *         description: ไม่พบ user
 */
router.get("/:id", ctrl.getOne);

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     tags: [Users]
 *     summary: เปลี่ยน role ของ user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRoleBody'
 *     responses:
 *       200:
 *         description: เปลี่ยน role สำเร็จ
 */
router.patch("/:id/role", ctrl.updateRole);

/**
 * @swagger
 * /api/users/{id}/toggle-verified:
 *   patch:
 *     tags: [Users]
 *     summary: Suspend / Unsuspend user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: เปลี่ยนสถานะสำเร็จ
 */
router.patch("/:id/toggle-verified", ctrl.toggleVerified);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: ลบ user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: ลบสำเร็จ
 */
router.delete("/:id", ctrl.deleteUser);

export default router;
