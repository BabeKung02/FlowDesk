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
      retryAfter: remainingMinutes
    });
  }
});

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

router.post("/register", ctrl.register);
router.post("/verify-email", otpLimiter, ctrl.verifyEmail);
router.post("/login", loginLimiter, ctrl.login);
router.post("/forgot-password", otpLimiter, ctrl.forgotPassword);
router.post("/reset-password", ctrl.resetPassword);
router.post("/change-password", authenticate, ctrl.changePassword); // ต้อง login
router.post("/resend-otp", otpLimiter, ctrl.resendOTP);
router.get("/otp-status", ctrl.getOTPStatus);
router.post("/verify-forgot-otp", otpLimiter, ctrl.verifyForgotOTP);

export default router;
