import authService from "../services/auth.service.js";
import { toUserFriendlyError } from "../utils/errorMapper.js";

const handle = (fn) => async (req, res) => {
  try {
    const result = await fn(req);
    res.json({ success: true, ...result });
  } catch (err) {
    const { status, message } = toUserFriendlyError(err);
    res.status(status).json({ success: false, message });
  }
};

export const register       = handle((req) => authService.register(req.body));
export const verifyEmail    = handle((req) => authService.verifyEmail(req.body));
export const login          = handle((req) => authService.login(req.body));
export const forgotPassword = handle((req) => authService.forgotPassword(req.body));
export const resetPassword  = handle((req) => authService.resetPassword(req.body));
export const getOTPStatus   = handle((req) => authService.getOTPStatus(req.query));
export const resendOTP      = handle((req) => authService.resendOTP(req.body));
export const verifyForgotOTP = handle((req) => authService.verifyForgotOTP(req.body));
export const refreshToken   = handle((req) => authService.refreshToken(req.body));

export const changePassword = handle((req) =>
  authService.changePassword({ userId: req.user.user_id, ...req.body })
);

// ส่ง rawToken ไปด้วยเพื่อให้ service หา record ที่ตรงกับเครื่องนี้
export const logout = handle((req) =>
  authService.logout({
    userId: req.user.user_id,
    rawToken: req.body.refreshToken,
  })
);

// logout ทุกเครื่องพร้อมกัน
export const logoutAll = handle((req) =>
  authService.logoutAll({ userId: req.user.user_id })
);
