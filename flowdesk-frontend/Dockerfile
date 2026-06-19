# ── Stage 1: Build ────────────────────────────────────
# ใช้ Node 20 เพื่อ build Angular ให้เป็น static files
# แยก stage นี้ออกมาเพื่อไม่ให้ node_modules (~500MB) ติดไปใน image จริง
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files ก่อน แล้วค่อย install
# เพื่อให้ Docker cache layer นี้ได้ — ถ้าโค้ดเปลี่ยนแต่ package ไม่เปลี่ยน
# Docker จะข้าม npm install ทำให้ build เร็วขึ้นมาก
COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Build Angular เป็น static files (output: /app/dist/flowdesk-frontend/browser)
RUN npm run build -- --configuration production

# ── Stage 2: Serve ────────────────────────────────────
# ใช้ Nginx แทน Node เพื่อ serve static files
# Nginx เบากว่า และเร็วกว่ามากสำหรับ static content
FROM nginx:alpine

# Copy static files จาก stage 1
COPY --from=builder /app/dist/flowdesk-frontend/browser /usr/share/nginx/html

# Copy config Nginx ที่รองรับ Angular routing (HTML5 pushState)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
