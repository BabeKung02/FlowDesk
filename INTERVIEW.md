# FlowDesk — Interview Q&A Guide

> ไฟล์นี้รวบรวมคำถามสัมภาษณ์ที่ Senior / Lead มักถาม พร้อมแนวทางตอบที่ดีที่สุด
> อัปเดตอัตโนมัติเมื่อมี feature ใหม่

---

## 🏗️ ภาพรวมโปรเจกต์

**Q: ช่วยอธิบาย FlowDesk ให้ฟังหน่อย**
> A: FlowDesk คือระบบจัดการคำขอและการอนุมัติ (Request & Approval) ใช้ Angular 20 เป็น Frontend, Node.js + Express เป็น Backend, PostgreSQL เป็นฐานข้อมูล และ Prisma เป็น ORM โดยมีระบบ Auth ครบวงจรตั้งแต่ Register, OTP verification, Login ด้วย JWT, และ Role-based access control แบ่งเป็น 3 roles คือ ADMIN, MANAGER, USER

**Q: ทำไมถึงเลือก Tech Stack นี้**
> A: Angular เพราะมี structure ชัดเจน เหมาะกับ enterprise app ที่มี role หลายระดับ Node.js + Express เพราะ lightweight และ flexible PostgreSQL เพราะข้อมูลมี relation ซับซ้อน (User → Request → Approval) และ Prisma เพราะ type-safe และจัดการ migration ได้ดีครับ

---

## 🔐 Authentication & Security

**Q: JWT ทำงานยังไงในโปรเจกต์นี้**
> A: ใช้ 2 tokens ครับ accessToken อายุ 15 นาที และ refreshToken อายุ 7 วัน ตอน login ได้ทั้งคู่ accessToken ใช้เรียก API ทุกครั้ง พอหมดอายุ error interceptor ฝั่ง Angular จะดัก 401 แล้วเรียก /refresh-token อัตโนมัติ จากนั้น retry request เดิมโดยที่ user ไม่รู้สึกอะไรเลย

**Q: ทำไมถึงแยก accessToken กับ refreshToken**
> A: ถ้าใช้ token เดียวอายุยาว แล้ว token หลุด ผู้ไม่หวังดีใช้ได้นานมาก การแยกทำให้ accessToken อายุสั้น ความเสี่ยงต่ำ ส่วน refreshToken เก็บใน DB ถ้า logout ลบออกจาก DB ทันที refreshToken นั้นใช้ต่อไม่ได้อีกครับ

**Q: เก็บ token ที่ไหน ปลอดภัยไหม**
> A: เก็บใน localStorage ครับ ซึ่งมีความเสี่ยง XSS แต่ Angular มี built-in XSS protection อยู่แล้ว ถ้าเป็น production จริงจะเปลี่ยนเป็น HttpOnly Cookie พร้อม SameSite=Strict เพื่อป้องกันทั้ง XSS และ CSRF ครับ

**Q: OTP ทำงานยังไง**
> A: ตอน register หรือ forgot password ระบบจะ generate OTP 6 หลัก เก็บ hash ใน DB พร้อม expire time 10 นาที ส่งทาง email ผ่าน Resend API และมี rate limiting 5 ครั้งต่อ 15 นาที ป้องกัน brute force ครับ

**Q: Role ดึงจากไหน JWT หรือ DB**
> A: ดึงจาก DB ทุกครั้งครับ เพราะถ้าเก็บใน JWT แล้ว Admin เปลี่ยน role user ใน DB token เดิมจะยังบอก role เก่าอยู่จนกว่าจะหมดอายุ ซึ่งเป็นช่องโหว่ด้าน security ดังนั้น auth middleware จึง query DB ทุก request เพื่อได้ role ที่เป็นปัจจุบันเสมอ

**Q: ป้องกัน Brute Force ยังไง**
> A: ใช้ express-rate-limit ครับ OTP จำกัด 5 ครั้งต่อ 15 นาที Login จำกัด 10 ครั้งต่อ 15 นาที และ bcrypt salt 12 rounds สำหรับ hash password

---

## 🏛️ Architecture & Design

**Q: อธิบาย folder structure ของ Backend หน่อย**
> A: แบ่งเป็น layers ครับ routes รับ request และกำหนด middleware, controllers รับ req/res และเรียก service, services เป็น business logic ทั้งหมด, middleware จัดการ auth และ role ทำให้แต่ละ layer มีหน้าที่ชัดเจน ทดสอบและแก้ไขแยกกันได้ครับ

**Q: ทำไม service layer ถึงไม่รับ req, res โดยตรง**
> A: เพื่อ separation of concerns ครับ service รู้แค่ business logic ไม่รู้ว่ามาจาก HTTP หรือช่องทางอื่น ทำให้ reuse ได้ และทดสอบ unit test ง่ายขึ้นมากเพราะไม่ต้อง mock HTTP objects

**Q: Prisma ดีกว่า raw SQL ยังไง**
> A: Type-safe ครับ ถ้าเขียน query ผิด TypeScript จะ error ตั้งแต่ compile time ไม่ใช่ runtime นอกจากนี้ migration จัดการ version ของ schema ได้ ทำให้ทีมทำงานร่วมกันง่ายขึ้นและ deploy ปลอดภัยขึ้นครับ

---

## 📋 Request & Approval System

**Q: USER กับ ADMIN เห็น request ต่างกันยังไง**
> A: USER เห็นแค่ request ของตัวเอง MANAGER และ ADMIN เห็นทั้งหมด ควบคุมใน service layer โดย check role ก่อน query Prisma เพื่อให้ business rule อยู่ที่เดียวครับ

**Q: ทำไม approve/reject ถึงไม่ให้ USER ทำ**
> A: ใช้ requireRole middleware ครับ route approve และ reject ผ่านได้แค่ ADMIN และ MANAGER เท่านั้น ถ้า USER พยายามเรียกจะได้ 403 Forbidden ทันที

**Q: พอ approve แล้วเกิดอะไรขึ้นบ้าง**
> A: อัปเดต status เป็น APPROVED บันทึก approverId, approvedAt, และ note ลง DB จากนั้นส่ง email แจ้ง requester อัตโนมัติผ่าน Resend ครับ โดยตั้งใจไม่ให้ email failure ทำให้ approve ล้มเหลว เพราะ email เป็น side effect ไม่ใช่ core business logic

**Q: ทำไม update request ได้แค่ตอน PENDING**
> A: เพราะถ้า request ถูก approve แล้ว การแก้ไขย้อนหลังจะทำให้ประวัติไม่ตรงกับสิ่งที่ approver เห็นตอนตัดสินใจ เป็น audit trail ที่ดีครับ

---

## 📊 Dashboard

**Q: dashboard/stats query DB กี่ครั้ง**
> A: 5 queries ครับ แต่ใช้ Promise.all รันพร้อมกันทั้งหมด ไม่ได้รันทีละตัว ทำให้เวลารวมเท่ากับ query ที่นานที่สุดตัวเดียว แทนที่จะเป็นผลรวมทั้งหมด

**Q: monthly trend คำนวณยังไง**
> A: ดึง request ย้อนหลัง 6 เดือน จากนั้น group by เดือนใน JavaScript ครับ เหตุผลที่ไม่ใช้ SQL GROUP BY เพราะถ้าเดือนไหนไม่มีข้อมูลเลย SQL จะไม่ return row นั้น แต่ frontend ต้องการครบทุกเดือน จึง pre-fill ทุกเดือนไว้ก่อนแล้วค่อย fill ข้อมูลทีหลังครับ

---

## 👥 User Management

**Q: ทำไม Admin ถึงลบตัวเองไม่ได้**
> A: ป้องกัน edge case ที่ระบบจะไม่มี ADMIN เหลืออยู่เลย ถ้า Admin คนเดียวลบตัวเองจะไม่มีใครจัดการระบบได้ครับ

**Q: Suspend user ทำยังไง**
> A: ใช้ toggle isVerified ครับ ถ้า isVerified เป็น false user จะ login ไม่ได้เพราะ auth service เช็ค field นี้ก่อน เลือกวิธีนี้แทนการลบเพราะ request ของ user ยังต้องอยู่ใน DB เพื่อ audit trail

---

## 🐳 Docker

**Q: อธิบาย Docker setup ของโปรเจกต์นี้**
> A: มี 3 containers ครับ frontend ใช้ Nginx serve Angular static files, backend รัน Node.js, และ postgres ทั้งหมดอยู่ใน network เดียวกันชื่อ flowdesk_network ทำให้คุยกันด้วยชื่อ service ได้เลย และใช้ named volume เก็บข้อมูล DB ไม่ให้หายเมื่อ restart

**Q: ทำไมใช้ Multi-stage build**
> A: เพื่อลดขนาด image ครับ Frontend ใช้ Node build Angular แล้วเอาแค่ static files ไปใส่ Nginx ทำให้ image เล็กลงจาก ~1GB เหลือ ~50MB Backend ติดตั้งเฉพาะ production dependencies ตัด devDependencies ออก

**Q: ทำไม backend ต้องรัน prisma generate ใน Dockerfile**
> A: Prisma Client generate ตาม OS และ architecture ครับ ถ้า generate บน Windows แล้วเอาไปรันบน Linux Alpine ใน container จะพังทันที จึงต้อง generate ใหม่ข้างใน container เสมอ

**Q: healthcheck ใน postgres ทำไมต้องมี**
> A: เพื่อให้ backend รอจน postgres พร้อมรับ connection จริงๆ ก่อนค่อย start ครับ เพราะ depends_on แค่รอให้ container start แต่ไม่ได้รอให้ DB พร้อม ถ้าไม่มี healthcheck backend อาจ connect ไม่ได้และ crash ตอน boot

---

## 🌐 API Design

**Q: ทำไมใช้ PATCH แทน PUT สำหรับ update**
> A: PUT หมายถึง replace ทั้ง resource ต้องส่งทุก field มา PATCH หมายถึง partial update ส่งแค่ field ที่ต้องการเปลี่ยน ซึ่งเหมาะกับ use case ของโปรเจกต์นี้มากกว่าครับ

**Q: มี API Documentation ไหม**
> A: มีครับ ใช้ Swagger UI เข้าถึงได้ที่ /api-docs เขียน JSDoc annotations ที่ route files ทุกไฟล์ ครอบคลุม Auth, Requests, Dashboard และ Users พร้อม request body schema และ response codes

**Q: Error handling ทำยังไง**
> A: มี 3 ระดับครับ service layer throw custom error พร้อม status code, controller รับและส่ง JSON response, และ global error handler ใน app.js รับ error ที่หลุดจาก try/catch ทั้งหมด ทำให้ไม่มี unhandled error ที่ทำให้ server crash

---

## ⚡ Performance & Scalability

**Q: ถ้า user เพิ่มขึ้นมากจะ scale ยังไง**
> A: Backend เป็น stateless ครับ เพราะ JWT ไม่ได้เก็บ session บน server ทำให้ scale out ได้ง่ายมาก แค่รัน docker compose scale backend=3 ก็ได้ 3 containers ทันที แต่ตอนนี้ยังไม่จำเป็นเพราะ user load ยังต่ำอยู่ครับ

**Q: ทำไมไม่ใช้ Redis**
> A: ณ ตอนนี้ยังไม่มี bottleneck ที่ต้องการ Redis ครับ OTP เก็บใน PostgreSQL ก็เพียงพอสำหรับ user load ปัจจุบัน ถ้า scale ถึงหลักหมื่น user ค่อยพิจารณาใช้ Redis cache OTP และ token blacklist ครับ

**Q: ทำไมถึงแยก RefreshToken ออกเป็นอีกตาราง**
> A: เพราะถ้าเก็บ refreshToken ใน users table ได้แค่ 1 token ต่อ user พอ login เครื่องที่ 2 จะทับ token เครื่องที่ 1 ทันที ทำให้ logout กลางคัน การแยกเป็นตารางทำให้แต่ละ device มี token row ของตัวเอง รองรับ multi-device ได้ถูกต้องครับ

**Q: ทำไมต้อง hash refreshToken**
> A: ถ้า DB หลุด เช่น SQL Injection หรือ backup leak แฮกเกอร์จะเอา refreshToken ไปใช้ได้ทันที การ hash ด้วย bcrypt ทำให้แม้ DB หลุด ก็ไม่รู้ค่าจริงของ token ครับ ใช้ salt rounds 10 เพราะ token random อยู่แล้ว ต่างจาก password ที่คนมักตั้งง่ายๆ

**Q: logout กับ logout-all ต่างกันยังไง**
> A: logout ส่ง refreshToken ของเครื่องนี้ไปด้วย backend จะ revoke เฉพาะ token นั้น เครื่องอื่นยังใช้งานได้ปกติ ส่วน logout-all จะ revoke ทุก token ของ user นั้นพร้อมกัน ทำให้ออกจากระบบทุกเครื่องทันทีครับ

---

## 🐰 RabbitMQ & Message Queue

**Q: อธิบาย Notification Flow ของโปรเจกต์นี้**
> A: เดิมพอ approve/reject ระบบจะส่ง email ตรงไปเลย ทำให้ response ต้องรอ email ส่งเสร็จก่อน ตอนนี้เปลี่ยนเป็น publish message เข้า RabbitMQ queue แล้ว return response ให้ user ที่กด approve ทันที ส่วน notification worker ซึ่งเป็น container แยก จะ consume message แล้วส่ง email ผ่าน Resend พร้อมบันทึก history ลง DB

**Q: ถ้า RabbitMQ ล้ม approve จะพังไหม**
> A: ไม่พังครับ queue.service.js ออกแบบให้ fail gracefully ถ้า connect RabbitMQ ไม่ได้จะไม่ throw error แต่ log warning และ publishNotification return false แทน ทำให้ approve/reject ยัง update DB สำเร็จได้ปกติ เพียงแค่ notification ไม่ไปเท่านั้น core business logic ไม่ผูกกับ infrastructure dependency

**Q: durable queue และ persistent message คืออะไร ต่างกันยังไง**
> A: durable: true บอก RabbitMQ ว่า queue นี้จะยังอยู่แม้ RabbitMQ restart ส่วน persistent: true บอกว่า message แต่ละอีกจะถูกเขียนลงดิสก์ ไม่หายไปแม้ RabbitMQ restart ก่อน worker จะ consume ทั้งสองอย่างจำเป็นเพื่อไม่ให้ notification หายไปเฉยๆ ตอน container restart

**Q: ack กับ nack ต่างกันยังไง**
> A: ack บอก RabbitMQ ว่าประมวลผล message นี้สำเร็จแล้ว ลบออกจาก queue ได้ nack บอกว่าล้มเหลว ส่ง message กลับเข้า queue ใหม่ให้ retry อีกรอบ ใช้ prefetch(1) จำกัด worker รับทีละ 1 message ป้องกัน overload

**Q: ทำไม worker แยก container จาก backend**
> A: เพื่อ separation of concerns และ scalability backend container รับ HTTP request อย่างเดียว ส่วน worker container ทำงาน background อย่างเดียว ถ้า email queue ยาวขึ้น สามารถ scale worker แยกจาก backend ได้เลย ไม่กระทบ performance ของ API

**Q: NotificationHistory เก็บไปเพื่ออะไร**
> A: เป็น audit trail ครับ เก็บบันทึกไว้ว่าส่ง notification อะไร ส่งเมื่อไหร่ ผ่าน channel ไหน สถานะ SENT หรือ FAILED ทำให้ debug ได้ว่า user ไม่ได้รับ email เพราะส่งไม่สำเร็จ หรือระบบไม่ได้ส่งเลย

**Q: API /api/notifications แสดงอะไรบ้าง USER กับ ADMIN เห็นไม่เหมือนกันอย่างไร**
> A: USER เห็นแค่ notification ของตัวเองโดย backend บังคับ where userId = ตัวเอง ส่วน ADMIN/MANAGER เห็นได้ทั้งหมด และส่ง query param userId เพื่อดู notification ของ user คนอื่นได้ เหมาะกับกรณี admin อยาก debug ว่าทำไม user คนหนึ่งไม่ได้รับ email

---

## 🔮 สิ่งที่พัฒนาต่อได้ (แสดงว่าคิดไกล)

**Q: ถ้ามีเวลาเพิ่มอยากทำอะไรอีก**
> A: มี 3 อย่างครับ อย่างแรก Unit tests สำหรับ auth.service และ request.service เพื่อ confidence ตอน refactor อย่างที่สอง Redis สำหรับ OTP cache และ dashboard stats cache อย่างที่สาม CI/CD pipeline ด้วย GitHub Actions build และ run tests อัตโนมัติตอน push code

---

*อัปเดตล่าสุด: 2026-06-09 | ครอบคลุม Step 1-8 (รวม RabbitMQ และ RefreshToken multi-device)*
