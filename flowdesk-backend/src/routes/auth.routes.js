import { Router } from "express";
import * as ctrl from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import rateLimit from "express-rate-limit";

const router = Router();

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  handler: (req, res) => {
    const remainingMs = req.rateLimit.resetTime - Date.now();
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    res.status(429).json({
      success: false,
      message: `คุณส่งคำขอบ่อยเกินไป กรุณารอ ${remainingMinutes} นาทีแล้วลองใหม่`,
      retryAfter: remainingMinutes,
    });
  },
});

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: สมัครสมาชิก
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterBody'
 *     responses:
 *       201:
 *         description: สมัครสำเร็จ รอยืนยัน OTP
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 */
router.post("/register", ctrl.register);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: ยืนยัน OTP สมัครสมาชิก
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otpCode]
 *             properties:
 *               email:   { type: string }
 *               otpCode: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         description: ยืนยันสำเร็จ
 */
router.post("/verify-email", otpLimiter, ctrl.verifyEmail);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: เข้าสู่ระบบ
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginBody'
 *     responses:
 *       200:
 *         description: เข้าสู่ระบบสำเร็จ ได้รับ accessToken + refreshToken
 *       401:
 *         description: อีเมลหรือรหัสผ่านไม่ถูกต้อง
 */
router.post("/login", loginLimiter, ctrl.login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: ขอรหัส OTP รีเซ็ตรหัสผ่าน
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: ส่ง OTP สำเร็จ
 */
router.post("/forgot-password", otpLimiter, ctrl.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: รีเซ็ตรหัสผ่าน
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otpCode, newPassword]
 *             properties:
 *               email:       { type: string }
 *               otpCode:     { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: รีเซ็ตสำเร็จ
 */
router.post("/reset-password", ctrl.resetPassword);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: เปลี่ยนรหัสผ่าน (ต้อง login)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword:     { type: string }
 *     responses:
 *       200:
 *         description: เปลี่ยนสำเร็จ
 */
router.post("/change-password", authenticate, ctrl.changePassword);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: รับ accessToken ใหม่ด้วย refreshToken
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: ได้รับ accessToken ใหม่
 */
router.post("/refresh-token", ctrl.refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: ออกจากระบบ (เครื่องนี้เท่านั้น)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: ออกจากระบบสำเร็จ
 */
router.post("/logout", authenticate, ctrl.logout);

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     tags: [Auth]
 *     summary: ออกจากระบบทุกอุปกรณ์
 *     responses:
 *       200:
 *         description: ออกจากระบบทุกอุปกรณ์สำเร็จ
 */
router.post("/logout-all", authenticate, ctrl.logoutAll);

router.post("/resend-otp", otpLimiter, ctrl.resendOTP);
router.get("/otp-status", ctrl.getOTPStatus);
router.post("/verify-forgot-otp", otpLimiter, ctrl.verifyForgotOTP);

export default router;
