/*
  Warnings:

  - Added the required column `event_type` to the `security_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."security_logs_action_idx";

-- AlterTable
ALTER TABLE "public"."security_logs" ADD COLUMN     "event_type" TEXT NOT NULL,
ADD COLUMN     "metadata" JSONB,
ALTER COLUMN "action" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "security_logs_event_type_idx" ON "public"."security_logs"("event_type");
