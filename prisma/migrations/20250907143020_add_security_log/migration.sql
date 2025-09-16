-- CreateTable
CREATE TABLE "public"."security_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "user_id" TEXT,
    "resource_id" TEXT,
    "resource_type" TEXT,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "security_logs_user_id_idx" ON "public"."security_logs"("user_id");

-- CreateIndex
CREATE INDEX "security_logs_action_idx" ON "public"."security_logs"("action");

-- CreateIndex
CREATE INDEX "security_logs_timestamp_idx" ON "public"."security_logs"("timestamp");
