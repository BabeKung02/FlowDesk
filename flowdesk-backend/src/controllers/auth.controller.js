import authService from "../services/auth.service.js";

const handle = (fn) => async (req, res) => {
  try {
    const result = await fn(req);
    res.json({ success: true, ...result });
  } catch (err) {
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

export const register = handle((req) => authService.register(req.body));
export const verifyEmail = handle((req) => authService.verifyEmail(req.body));
export const login = handle((req) => authService.login(req.body));
export const forgotPassword = handle((req) =>
  authService.forgotPassword(req.body),
);
export const resetPassword = handle((req) =>
  authService.resetPassword(req.body),
);
export const getOTPStatus = handle((req) =>
  authService.getOTPStatus(req.query),
);
export const resendOTP = handle((req) => authService.resendOTP(req.body));
export const changePassword = handle((req) =>
  authService.changePassword({
    userId: req.user.user_id,
    ...req.body,
  }));
  export const verifyForgotOTP = handle((req) =>
  authService.verifyForgotOTP(req.body)
);
