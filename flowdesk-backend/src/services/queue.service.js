import amqplib from "amqplib";

const QUEUE_NAME = "notifications";
let channel = null;

// ── Connect ───────────────────────────────────────────
// Singleton connection — เชื่อมครั้งเดียว reuse ตลอด
export const connectQueue = async () => {
  try {
    const conn = await amqplib.connect(process.env.RABBITMQ_URL);
    channel = await conn.createChannel();

    // durable: true → queue ยังอยู่แม้ RabbitMQ restart
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    console.log("🐰 RabbitMQ connected");

    // ถ้า connection หลุด log ไว้ให้รู้
    conn.on("error", (err) => console.error("RabbitMQ connection error:", err.message));
    conn.on("close", () => console.warn("⚠️ RabbitMQ connection closed"));

    return channel;
  } catch (err) {
    // ไม่ crash server ถ้า RabbitMQ ยังไม่พร้อม แค่ log warning
    console.warn("⚠️ RabbitMQ not available — notifications will be sent synchronously");
    return null;
  }
};

// ── Publish ───────────────────────────────────────────
// ยัด message เข้า queue
// persistent: true → message ยังอยู่แม้ RabbitMQ restart ก่อน consume
export const publishNotification = (payload) => {
  if (!channel) {
    console.warn("⚠️ RabbitMQ channel not available, skipping queue");
    return false;
  }

  try {
    channel.sendToQueue(
      QUEUE_NAME,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true }
    );
    console.log(`📨 Published to queue: ${payload.type} → ${payload.to}`);
    return true;
  } catch (err) {
    console.error("Failed to publish to queue:", err.message);
    return false;
  }
};

// ── Consume ───────────────────────────────────────────
// Worker ใช้ function นี้เพื่อรับ message จาก queue
// prefetch(1) → รับทีละ 1 message ป้องกัน worker overload
export const consumeNotifications = async (handler) => {
  if (!channel) {
    console.warn("⚠️ RabbitMQ channel not available");
    return;
  }

  channel.prefetch(1);

  channel.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;

    try {
      const payload = JSON.parse(msg.content.toString());
      await handler(payload);

      // ack = บอก RabbitMQ ว่าประมวลผลสำเร็จ ลบออกจาก queue ได้
      channel.ack(msg);
    } catch (err) {
      console.error("Failed to process notification:", err.message);

      // nack = ประมวลผลล้มเหลว ส่ง message กลับเข้า queue ใหม่
      channel.nack(msg, false, true);
    }
  });

  console.log("👂 Notification worker listening...");
};
