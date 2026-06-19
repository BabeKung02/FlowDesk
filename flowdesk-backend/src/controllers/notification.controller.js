import notificationService from "../services/notification.service.js";
import { toUserFriendlyError } from "../utils/errorMapper.js";

const handle = (fn) => async (req, res) => {
  try {
    const data = await fn(req);
    res.json({ success: true, ...data });
  } catch (err) {
    const { status, message } = toUserFriendlyError(err);
    res.status(status).json({ success: false, message });
  }
};

// GET /api/notifications
export const getAll = handle((req) =>
  notificationService.getAll({ user: req.user, query: req.query })
);
