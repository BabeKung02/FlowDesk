import announcementService from "../services/announcement.service.js";
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

const handleOne = (fn, status = 200) => async (req, res) => {
  try {
    const data = await fn(req);
    res.status(status).json({ success: true, data });
  } catch (err) {
    const mapped = toUserFriendlyError(err);
    res.status(mapped.status).json({ success: false, message: mapped.message });
  }
};

// POST /api/announcements  (ADMIN only)
export const create = handleOne(
  (req) => announcementService.create({ body: req.body, user: req.user }),
  201
);

// GET /api/announcements  (ADMIN only)
export const getAll = handle((req) =>
  announcementService.getAll({ query: req.query })
);
