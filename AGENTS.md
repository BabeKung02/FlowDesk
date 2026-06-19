# FlowDesk — Development Roadmap & Agent Instructions

## Purpose of this file
`AGENTS.md` บอก Claude (หรือ AI agent อื่น) ว่าโปรเจกต์นี้อยู่ที่ไหน ทำอะไรเสร็จแล้ว
และต้องพัฒนาอะไรต่อ — อ่านไฟล์นี้ก่อนทุกครั้งที่เริ่มงานใหม่

---

## ✅ Completed
- [x] Auth System ครบ (Register / Login / OTP / Reset Password / Change Password)
- [x] JWT accessToken + refreshToken
- [x] Rate limiting (OTP: 5/15min, Login: 10/15min)
- [x] Frontend routing + authGuard
- [x] Auth interceptor แนบ token อัตโนมัติ
- [x] Bug fixes เมื่อ 2026-05-28 (resendOTP, token keys, resend dependency)

---

## 🔨 Step 1 — Token Refresh Flow ✅ เสร็จแล้ว (2026-05-28)
**ทำไมสำคัญ:** accessToken หมดอายุใน 15 นาที ถ้าไม่มี auto-refresh ผู้ใช้จะถูก logout กลางคัน

- [x] `POST /api/auth/refresh-token` — รับ refreshToken, ตรวจสอบกับ DB, คืน accessToken ใหม่
- [x] `POST /api/auth/logout` — ลบ refreshToken ออกจาก DB
- [x] `error.interceptor.ts` — ดัก HTTP 401 → เรียก refresh-token → retry request เดิม
- [x] ถ้า refresh ล้มเหลว → logout และ redirect `/login`

---

## 🔨 Step 2 — Role & Permission System ✅ เสร็จแล้ว (2026-05-28)

- [x] เพิ่ม `Role` enum (`ADMIN`, `MANAGER`, `USER`) ใน `schema.prisma`
- [x] เพิ่ม `role` field ใน `User` model (`@default(USER)`)
- [x] `auth.middleware.js` — ดึง role จาก DB ทุกครั้ง (ไม่เก็บใน JWT)
- [x] เพิ่ม `requireRole(...roles)` middleware สำหรับป้องกัน endpoint
- [x] สร้าง `role.guard.ts` (Frontend) — `roleGuard('ADMIN', 'MANAGER')`
- [x] ป้องกัน `/user-management` (ADMIN) และ `/approvals` (ADMIN, MANAGER)
- [x] `login` response ส่ง `role` กลับมาด้วย

> ⚠️ ต้องรัน: `npx prisma migrate dev --name add_role` และ `npx prisma generate`

---

## 🔨 Step 3 — Request System ✅ เสร็จแล้ว (2026-06-08)

- [x] เพิ่ม `RequestStatus` enum และ `Request` model ใน schema.prisma
- [x] สร้าง `request.service.js` — getAll, getOne, create, update, cancel
- [x] สร้าง `request.controller.js`
- [x] สร้าง `request.routes.js`
- [x] เพิ่ม `/api/requests` ใน `app.js`

> ⚠️ ต้องรัน: `npx prisma migrate dev --name add_request` และ `npx prisma generate`

---

## 🔨 Step 4 — Approval System ✅ เสร็จแล้ว (2026-06-08)

- [x] เพิ่ม `approverId`, `approvedAt`, `note` ใน `Request` model
- [x] เพิ่ม relation `ApprovedBy` ใน `User` model
- [x] `approve()` และ `reject()` ใน `request.service.js`
- [x] ส่ง email แจ้ง requester อัตโนมัติภายหลัง approve/reject
- [x] `PATCH /api/requests/:id/approve` และ `/reject` (ADMIN, MANAGER เท่านั้น)
- [x] `sendApprovalEmail()` ใน `email.service.js`

> ⚠️ ต้องรัน: `npx prisma migrate dev --name add_approval_fields` และ `npx prisma generate`

---

## 🔨 Step 5 — Dashboard ✅ เสร็จแล้ว (2026-06-08)

- [x] `GET /api/dashboard/stats` — จำนวน request แยกตาม status (USER เห็นแค่ของตัวเอง)
- [x] `GET /api/dashboard/recent` — กิจกรรมล่าสุด 10 รายการ
- [x] `GET /api/dashboard/monthly-trend` — trend รายเดือนย้อนหลัง 6 เดือน (สำหรับ Bar Chart)

---

## 🔨 Step 6 — User Management ✅ เสร็จแล้ว (2026-06-08)

- [x] `GET /api/users` — ดูรายชื่อ user ทั้งหมด + search + filter role + pagination
- [x] `GET /api/users/:id` — ดู user คนเดียว
- [x] `PATCH /api/users/:id/role` — เปลี่ยน role (ป้องกันเปลี่ยน role ตัวเอง)
- [x] `PATCH /api/users/:id/toggle-verified` — suspend/unsuspend user
- [x] `DELETE /api/users/:id` — ลบ user (ป้องกันลบตัวเอง)
- [x] ทุก route ป้องกันด้วย `requireRole('ADMIN')`

---

## 🔨 Step 7 — Production Ready ✅ เสร็จแล้ว (2026-06-08)

- [x] Morgan logging — แสดง request ทุกตัวใน terminal
- [x] Swagger UI — API docs ที่ http://localhost:3000/api-docs
- [x] JSDoc annotations ครบทุก route (Auth, Requests, Dashboard, Users)
- [x] 404 handler — จับ route ที่ไม่มีอยู่
- [x] Global error handler — จับ unhandled error ทั้งหมด

> ⚠️ ต้องรัน: `npm install` ใน flowdesk-backend เพื่อติดตั้ง morgan และ swagger packages

---

## ✅ Completed — Additional
- [x] RefreshToken แยกออกเป็นตารางใหม่ + hash ด้วย bcrypt (2026-06-09)
- [x] รองรับ multi-device login (แต่ละเครื่องมี token แยกกัน)
- [x] logout เครื่องเดียว vs logout-all ทุกเครื่อง

---

## 🔨 Step 8 — RabbitMQ Notification Queue ✅ เสร็จแล้ว (2026-06-09)

**ทำไมสำคัญ:** แยก email sending ออกจาก approve/reject flow ไม่ให้ response ต้องรอ email

- [x] เพิ่ม `amqplib` ใน package.json
- [x] เพิ่ม `NotificationHistory` model ใน schema.prisma (audit trail)
- [x] สร้าง `queue.service.js` — connectQueue, publishNotification, consumeNotifications
- [x] สร้าง `notification.worker.js` — consume queue, ส่ง email + บันทึก history
- [x] แก้ `request.service.js` — approve/reject publish เข้า queue แทนส่ง email ตรงๆ
- [x] `app.js` — connectQueue() ตอน server start
- [x] `docker-compose.yml` — เพิ่ม container `rabbitmq` (management UI :15672) และ `worker`
- [x] `package.json` — script `worker` / `worker:dev`

> ⚠️ ต้องรัน:
> 1. `npm install` ใน flowdesk-backend เพื่อติดตั้ง amqplib
> 2. `npx prisma migrate dev --name add_notification_history` และ `npx prisma generate`
> 3. Dev นอก Docker: ระบ worker แยกด้วย `npm run worker:dev` (ต้องมี rabbitmq container รันอยู่ก่อน)
> 4. Management UI: http://localhost:15672 (admin / admin123)

---

## 🔨 Step 9 — Notification History API ✅ เสร็จแล้ว (2026-06-10)

**ทำไมสำคัญ:** Step 8 เขียน NotificationHistory ลง DB อยู่แล้ว แต่ยังไม่มี endpoint ให้ frontend ดึงไปแสดง

- [x] สร้าง `notification.service.js` (Backend) — getAll พร้อม filter status, userId, pagination
- [x] สร้าง `notification.controller.js` + `notification.routes.js`
- [x] เพิ่ม `/api/notifications` ใน `app.js` (พร้อม Swagger docs)
- [x] USER เห็นแค่ของตัวเอง / ADMIN-MANAGER เห็นทั้งหมด หรือ filter ด้วย `userId`
- [x] Frontend: สร้าง `notification.service.ts` — `NotificationService.getAll()`

> ⚠️ ไม่ต้อง migrate เพิ่ม (ไม่ได้แก้ schema)
> ⚠️ ยังไม่ได้สร้าง UI component (หน้าแสดงผล) — มีแค่ service เรียก API

---

## 🔨 Step 10 — Announcement Broadcast ✅ เสร็จแล้ว (2026-06-11)

**ทำไมสำคัญ:** ADMIN อยากประกาศข่าวสำคัญให้ user ทุกคนพร้อมกัน ต่างจาก approval notification ที่ส่งแค่ 1 คน

- [x] เพิ่ม `Announcement` model ใน schema.prisma
- [x] แก้ `NotificationHistory.requestId` เป็น optional (announcement ไม่มี request เกี่ยวข้อง)
- [x] เพิ่ม `sendAnnouncementEmail()` ใน email.service.js (template แยกจาก approval)
- [x] แก้ `notification.worker.js` — แยก handler ตาม type (APPROVED/REJECTED vs ANNOUNCEMENT)
- [x] สร้าง `announcement.service.js` — create() ดึง verified users ทั้งหมด แล้ว publish เข้า queue ทีละคน
- [x] สร้าง `announcement.controller.js` + `announcement.routes.js` (ADMIN only)
- [x] เพิ่ม `/api/announcements` ใน app.js
- [x] Frontend: สร้าง `announcement.service.ts`

> ⚠️ ต้องรับ: `npx prisma migrate dev --name add_announcement` และ `npx prisma generate`
> ⚠️ ยังไม่ได้สร้าง UI — ปุ่ม + popup สำหรับ ADMIN กรอกประกาศ

---

## 🔮 Step ต่อไป — ยังไม่ได้เริ่ม

- [ ] Frontend: สร้างหน้า Notification History component (ใช้ NotificationService ที่มีแล้ว)
- [ ] Frontend: ปุ่ม + popup ประกาศสำหรับ ADMIN (ใช้ AnnouncementService ที่มีแล้ว)
- [ ] Unit tests สำหรับ auth.service และ request.service
- [ ] Redis — cache OTP และ dashboard stats (ถ้าอยากแสดง stack เพื่อ)
- [ ] CI/CD pipeline (GitHub Actions)

---

## Agent Guidelines
- ทำ Step ตามลำดับ — อย่าข้าม Step 1 และ 2 เพราะ Step 3+ ขึ้นอยู่กับมัน
- ก่อนแก้ไขไฟล์ใดๆ ให้อ่านไฟล์นั้นก่อนเสมอ
- Backend ใช้ ES Modules (`import/export`) ไม่ใช่ CommonJS
- Frontend ใช้ Angular standalone components (ไม่มี NgModule)
- ทุกครั้งที่แก้ schema.prisma ต้องรัน `npx prisma migrate dev` และ `npx prisma generate`
- อัปเดต INTERVIEW.md ตามความเหมาะสมด้วย