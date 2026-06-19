import userService from "../services/user.service.js";
import { toUserFriendlyError } from "../utils/errorMapper.js";

const handleOne = (fn, status = 200) => async (req, res) => {
  try {
    const data = await fn(req);
    res.status(status).json({ success: true, data });
  } catch (err) {
    const mapped = toUserFriendlyError(err);
    res.status(mapped.status).json({ success: false, message: mapped.message });
  }
};

const handle = (fn) => async (req, res) => {
  try {
    const data = await fn(req);
    res.json({ success: true, ...data });
  } catch (err) {
    const { status, message } = toUserFriendlyError(err);
    res.status(status).json({ success: false, message });
  }
};

// GET /api/users
export const getAll = handle((req) =>
  userService.getAll({ query: req.query })
);

// GET /api/users/:id
export const getOne = handleOne((req) =>
  userService.getOne({ id: req.params.id })
);

// PATCH /api/users/:id/role
export const updateRole = handleOne((req) =>
  userService.updateRole({ id: req.params.id, body: req.body, adminId: req.user.user_id })
);

// PATCH /api/users/:id/toggle-verified
export const toggleVerified = handleOne((req) =>
  userService.toggleVerified({ id: req.params.id, adminId: req.user.user_id })
);

// DELETE /api/users/:id
export const deleteUser = handle((req) =>
  userService.deleteUser({ id: req.params.id, adminId: req.user.user_id })
);
