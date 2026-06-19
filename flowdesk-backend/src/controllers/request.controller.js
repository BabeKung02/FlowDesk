import requestService from "../services/request.service.js";
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

// GET /api/requests
export const getAll = handle((req) =>
  requestService.getAll({ user: req.user, query: req.query })
);

// GET /api/requests/:id
export const getOne = handleOne((req) =>
  requestService.getOne({ id: req.params.id, user: req.user })
);

// POST /api/requests
export const create = handleOne(
  (req) => requestService.create({ body: req.body, user: req.user }),
  201
);

// PATCH /api/requests/:id
export const update = handleOne((req) =>
  requestService.update({ id: req.params.id, body: req.body, user: req.user })
);

// PATCH /api/requests/:id/cancel
export const cancel = handleOne((req) =>
  requestService.cancel({ id: req.params.id, user: req.user })
);

// PATCH /api/requests/:id/approve  (ADMIN, MANAGER only)
export const approve = handleOne((req) =>
  requestService.approve({ id: req.params.id, body: req.body, user: req.user })
);

// PATCH /api/requests/:id/reject  (ADMIN, MANAGER only)
export const reject = handleOne((req) =>
  requestService.reject({ id: req.params.id, body: req.body, user: req.user })
);
