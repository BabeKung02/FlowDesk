import dashboardService from "../services/dashboard.service.js";
import { toUserFriendlyError } from "../utils/errorMapper.js";

const handleOne = (fn) => async (req, res) => {
  try {
    const data = await fn(req);
    res.json({ success: true, data });
  } catch (err) {
    const { status, message } = toUserFriendlyError(err);
    res.status(status).json({ success: false, message });
  }
};

// GET /api/dashboard/stats
export const getStats = handleOne((req) =>
  dashboardService.getStats({ user: req.user })
);

// GET /api/dashboard/recent
export const getRecent = handleOne((req) =>
  dashboardService.getRecent({ user: req.user })
);

// GET /api/dashboard/monthly-trend
export const getMonthlyTrend = handleOne((req) =>
  dashboardService.getMonthlyTrend({ user: req.user })
);
