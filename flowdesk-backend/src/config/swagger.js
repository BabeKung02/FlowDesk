import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FlowDesk API",
      version: "1.0.0",
      description: "Request & Approval Management System API",
    },
    servers: [
      { url: "http://localhost:3000", description: "Development" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        // ── Auth ──────────────────────────────────────
        RegisterBody: {
          type: "object",
          required: ["firstName", "lastName", "email", "password"],
          properties: {
            firstName: { type: "string", example: "สมชาย" },
            lastName:  { type: "string", example: "ใจดี" },
            email:     { type: "string", example: "somchai@example.com" },
            password:  { type: "string", example: "Password123!" },
          },
        },
        LoginBody: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email:    { type: "string", example: "somchai@example.com" },
            password: { type: "string", example: "Password123!" },
          },
        },
        // ── Request ───────────────────────────────────
        RequestBody: {
          type: "object",
          required: ["title", "type"],
          properties: {
            title:       { type: "string", example: "ขออนุมัติซื้ออุปกรณ์" },
            description: { type: "string", example: "ต้องการซื้อคอมพิวเตอร์ใหม่" },
            type:        { type: "string", example: "purchase" },
          },
        },
        ApprovalBody: {
          type: "object",
          properties: {
            note: { type: "string", example: "อนุมัติแล้ว ดำเนินการได้เลย" },
          },
        },
        // ── User ──────────────────────────────────────
        UpdateRoleBody: {
          type: "object",
          required: ["role"],
          properties: {
            role: { type: "string", enum: ["ADMIN", "MANAGER", "USER"] },
          },
        },
        // ── Common ────────────────────────────────────
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "เกิดข้อผิดพลาด" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
