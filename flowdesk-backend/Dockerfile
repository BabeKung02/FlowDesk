# ── Stage 1: Dependencies ─────────────────────────────
# แยก stage เพื่อติดตั้งเฉพาะ production dependencies
# ไม่เอา devDependencies (nodemon, typescript, ts-node) ไปด้วย
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: Production ───────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy node_modules จาก stage 1 (production only)
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma Client ใน image
# ต้องทำตรงนี้เพราะ Prisma Client สร้างขึ้นตาม OS/architecture
# ถ้า generate บน Windows แล้วเอาไปรันบน Linux (Alpine) จะพัง
RUN npx prisma generate

EXPOSE 3000

# ใช้ script นี้แทน node โดยตรง เพื่อ:
# 1. รัน prisma migrate deploy ก่อน (apply migration ที่ยังไม่ได้ apply)
# 2. จากนั้นถึงเริ่ม server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/app.js"]
