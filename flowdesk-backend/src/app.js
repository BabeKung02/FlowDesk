import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import { connectQueue } from './services/queue.service.js';
import { toUserFriendlyError } from './utils/errorMapper.js';
import authRoutes from './routes/auth.routes.js';
import requestRoutes from './routes/request.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import userRoutes from './routes/user.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import announcementRoutes from './routes/announcement.routes.js';

const app = express();

// ── Security ──────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));

// ── Logging ───────────────────────────────────────────
// dev format: METHOD /path STATUS ms — เห็นทุก request ใน terminal
app.use(morgan('dev'));

// ── Body Parser ───────────────────────────────────────
app.use(express.json());

// ── API Docs ──────────────────────────────────────────
// เข้าถึงได้ที่ http://localhost:3000/api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Routes ────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/announcements', announcementRoutes);

// ── 404 Handler ───────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'ไม่พบ endpoint นี้' });
});

// ── Global Error Handler ──────────────────────────────
app.use((err, req, res, next) => {
  const { status, message } = toUserFriendlyError(err);
  res.status(status).json({ success: false, message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
  await connectQueue();
});
