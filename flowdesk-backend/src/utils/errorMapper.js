// ── Error Message Mapper ──────────────────────────────
// แปลง error ดิบจาก Prisma/database/system ให้เป็นข้อความไทยที่ user เข้าใจได้
// ใช้ร่วมกับทุก controller wrapper เพื่อไม่ให้ error message ทาง technical หลุดไปถึง user

const FALLBACK_MESSAGE = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";

// error ที่เรา throw เองด้วย createError() จะมี err.status ติดมาด้วยเสมอ
// แปลว่าเป็น "expected error" ที่ message เขียนมาให้ user อ่านแล้ว ส่งตรงได้เลย
const isAppError = (err) => typeof err.status === "number";

// ── Prisma Error Codes ────────────────────────────────
// อ้างอิง: https://www.prisma.io/docs/orm/reference/error-reference
const PRISMA_ERROR_MESSAGES = {
  P1000: "เชื่อมต่อฐานข้อมูลล้มเหลว กรุณาตรวจสอบ Username/Password",
  P1001: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
  P1008: "การเชื่อมต่อฐานข้อมูลใช้เวลานานเกินไป กรุณาลองใหม่",
  P2002: "ข้อมูลนี้มีอยู่ในระบบแล้ว",
  P2003: "ไม่สามารถดำเนินการได้ เนื่องจากข้อมูลนี้ถูกใช้งานอยู่",
  P2025: "ไม่พบข้อมูลที่ต้องการ",
};

// column/table ไม่ตรงกับ schema (มักเกิดจากลืม migrate)
const isSchemaMismatchError = (err) =>
  err.message?.includes("does not exist in the current database") ||
  err.message?.includes("Unknown column") ||
  err.code === "P2021" || // table ไม่มี
  err.code === "P2022";   // column ไม่มี

// ── Main Mapper ───────────────────────────────────────
export const toUserFriendlyError = (err) => {
  // 1. error ที่เราคุมเอง (createError) — ข้อความพร้อมใช้แล้ว
  if (isAppError(err)) {
    return { status: err.status, message: err.message };
  }

  // 2. schema mismatch — สื่อสารแบบไม่เปิดเผยรายละเอียดทาง technical ให้ user
  //    แต่ log รายละเอียดจริงไว้ฝั่ง server เพื่อให้ dev ตามแก้ได้
  if (isSchemaMismatchError(err)) {
    console.error("⚠️ Schema mismatch — ลืม migrate หรือเปล่า?:", err.message);
    return {
      status: 500,
      message: "ระบบกำลังปรับปรุง กรุณาลองใหม่ในอีกสักครู่ หรือติดต่อผู้ดูแลระบบ",
    };
  }

  // 3. Prisma known error codes
  if (err.code && PRISMA_ERROR_MESSAGES[err.code]) {
    return { status: 500, message: PRISMA_ERROR_MESSAGES[err.code] };
  }

  // 4. ไม่รู้จัก — fallback กลางๆ ไม่เปิดเผยรายละเอียดระบบ
  console.error("Unhandled error:", err);
  return { status: 500, message: FALLBACK_MESSAGE };
};
