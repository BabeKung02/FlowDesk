# FlowDesk — Project Context for Claude

## What is this project?
FlowDesk is a **Request & Approval Management System** — a fullstack web app where users
can submit requests and managers/admins can approve or reject them.

## Tech Stack
| Layer     | Tech                                                              |
|-----------|-------------------------------------------------------------------|
| Frontend  | Angular 20, Angular Material, Tailwind CSS, Chart.js, SweetAlert2 |
| Backend   | Node.js (ESM), Express 5, Prisma ORM                             |
| Database  | PostgreSQL (port 5433, db: `flowdesk_db`)                        |
| Auth      | JWT (accessToken 15m + refreshToken 7d), bcryptjs                |
| Email     | Resend API (`resend` package)                                    |

## Project Structure
```
D:\FlowDesk\
├── flowdesk-backend/
│   ├── src/
│   │   ├── app.js                   Entry point (port 3000)
│   │   ├── routes/                  auth.routes.js
│   │   ├── controllers/             auth.controller.js
│   │   ├── services/                auth.service.js, email.service.js
│   │   ├── middleware/              auth.middleware.js
│   │   └── config/
│   └── prisma/schema.prisma
└── flowdesk-frontend/
    └── src/app/
        ├── core/                    guards, interceptors, models, services
        ├── features/                auth, dashboard, all-request, approval, user-management, admin
        ├── layout/                  main-layout (shown after login)
        └── shared/
```

## Dev Commands
```bash
# Backend (port 3000)
cd flowdesk-backend && npm run dev

# Frontend (port 4200)
cd flowdesk-frontend && npm start
```

## Auth Flow
1. Register → OTP via Resend email → Verify OTP
2. Login → returns `accessToken` (15m) + `refreshToken` (7d)
3. Frontend stores both in `localStorage` under keys `accessToken` / `refreshToken`
4. `authInterceptor` attaches `Authorization: Bearer <accessToken>` automatically
5. Protected routes guarded by `authGuard`

## Current DB Schema (users table only)
```
user_id, first_name, last_name, email, password,
is_verified, otp_code, otp_expires, otp_purpose,
refresh_token, created_at, updated_at
```
> ⚠️ No `role` field yet — needed before building Approvals / User Management

## API Endpoints (implemented)
```
POST /api/auth/register
POST /api/auth/verify-email
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/verify-forgot-otp
POST /api/auth/reset-password
POST /api/auth/change-password    ← requires Bearer token
POST /api/auth/resend-otp
GET  /api/auth/otp-status
```

## Fixes Applied (2026-05-28)
- `resendOTP` bug: `data: { otpData }` → `data: { ...otpData }`
- Added `resend` to backend `package.json`
- `auth.service.ts`: token key `'token'` → `'accessToken'`, added `refreshToken` support
- `auth-interceptor.ts`: reads `'accessToken'` from localStorage

## Environment (backend .env)
```
PORT=3000
DATABASE_URL=postgresql://postgres:1234@localhost:5433/flowdesk_db?schema=public
JWT_SECRET, JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN=7d
RESEND_API_KEY, EMAIL_FROM=onboarding@resend.dev
FRONTEND_URL=http://localhost:4200
```
