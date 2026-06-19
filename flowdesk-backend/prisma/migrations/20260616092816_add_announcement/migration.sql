/*
  Warnings:

  - You are about to drop the column `refresh_token` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "requests" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approverId" UUID,
ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "refresh_token";

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "createdBy" UUID NOT NULL,
    "recipient_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_histories" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "requestId" UUID,
    "type" VARCHAR(20) NOT NULL,
    "message" TEXT NOT NULL,
    "channel" VARCHAR(20) NOT NULL DEFAULT 'EMAIL',
    "status" VARCHAR(10) NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_histories" ADD CONSTRAINT "notification_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
