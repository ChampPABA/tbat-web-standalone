-- CreateEnum
CREATE TYPE "public"."PackageType" AS ENUM ('FREE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "public"."Subject" AS ENUM ('BIOLOGY', 'CHEMISTRY', 'PHYSICS');

-- CreateEnum
CREATE TYPE "public"."SessionTime" AS ENUM ('09:00-12:00', '13:00-16:00');

-- CreateEnum
CREATE TYPE "public"."PaymentType" AS ENUM ('ADVANCED_PACKAGE', 'POST_EXAM_UPGRADE');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."AdminRole" AS ENUM ('ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "public"."ActionType" AS ENUM ('USER_UPDATE', 'CODE_REGEN', 'PDF_UPLOAD', 'CRISIS_RESOLUTION');

-- CreateEnum
CREATE TYPE "public"."IssueType" AS ENUM ('CODE_PROBLEM', 'PAYMENT_ISSUE', 'RESULT_ERROR', 'PDF_ACCESS');

-- CreateEnum
CREATE TYPE "public"."TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "thai_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "line_id" TEXT,
    "package_type" "public"."PackageType" NOT NULL DEFAULT 'FREE',
    "is_upgraded" BOOLEAN NOT NULL DEFAULT false,
    "pdpa_consent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."exam_codes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "package_type" "public"."PackageType" NOT NULL,
    "subject" "public"."Subject" NOT NULL,
    "session_time" "public"."SessionTime" NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "exam_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session_capacities" (
    "id" TEXT NOT NULL,
    "session_time" "public"."SessionTime" NOT NULL,
    "current_count" INTEGER NOT NULL DEFAULT 0,
    "max_capacity" INTEGER NOT NULL DEFAULT 300,
    "exam_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_capacities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'thb',
    "payment_type" "public"."PaymentType" NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exam_results" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "exam_code_id" TEXT NOT NULL,
    "total_score" DOUBLE PRECISION NOT NULL,
    "biology_score" DOUBLE PRECISION,
    "chemistry_score" DOUBLE PRECISION,
    "physics_score" DOUBLE PRECISION,
    "percentile" DOUBLE PRECISION,
    "completion_time" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_accessible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."analytics" (
    "id" TEXT NOT NULL,
    "result_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subject_breakdowns" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "comparison_data" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pdf_solutions" (
    "id" TEXT NOT NULL,
    "subject" "public"."Subject" NOT NULL,
    "exam_date" TIMESTAMP(3) NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "upload_admin_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pdf_solutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pdf_downloads" (
    "id" TEXT NOT NULL,
    "pdf_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "download_token" TEXT NOT NULL,
    "downloaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pdf_downloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pdf_notifications" (
    "id" TEXT NOT NULL,
    "pdf_id" TEXT NOT NULL,
    "sent_to_user_ids" TEXT[],
    "email_count" INTEGER NOT NULL,
    "failed_count" INTEGER NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pdf_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "thai_name" TEXT NOT NULL,
    "role" "public"."AdminRole" NOT NULL,
    "permissions" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action_type" "public"."ActionType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "original_data" JSONB NOT NULL,
    "new_data" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."support_tickets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "issue_type" "public"."IssueType" NOT NULL,
    "description" TEXT NOT NULL,
    "resolution" TEXT,
    "status" "public"."TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_session_token_key" ON "public"."user_sessions"("session_token");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "public"."user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "public"."accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "public"."accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "public"."verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "public"."verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "exam_codes_code_key" ON "public"."exam_codes"("code");

-- CreateIndex
CREATE INDEX "exam_codes_user_id_idx" ON "public"."exam_codes"("user_id");

-- CreateIndex
CREATE INDEX "exam_codes_code_idx" ON "public"."exam_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "session_capacities_session_time_exam_date_key" ON "public"."session_capacities"("session_time", "exam_date");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripe_payment_intent_id_key" ON "public"."payments"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "payments_user_id_idx" ON "public"."payments"("user_id");

-- CreateIndex
CREATE INDEX "payments_stripe_payment_intent_id_idx" ON "public"."payments"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "exam_results_user_id_idx" ON "public"."exam_results"("user_id");

-- CreateIndex
CREATE INDEX "exam_results_exam_code_id_idx" ON "public"."exam_results"("exam_code_id");

-- CreateIndex
CREATE INDEX "analytics_user_id_idx" ON "public"."analytics"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_result_id_key" ON "public"."analytics"("result_id");

-- CreateIndex
CREATE INDEX "pdf_solutions_subject_idx" ON "public"."pdf_solutions"("subject");

-- CreateIndex
CREATE UNIQUE INDEX "pdf_downloads_download_token_key" ON "public"."pdf_downloads"("download_token");

-- CreateIndex
CREATE INDEX "pdf_downloads_user_id_idx" ON "public"."pdf_downloads"("user_id");

-- CreateIndex
CREATE INDEX "pdf_downloads_pdf_id_idx" ON "public"."pdf_downloads"("pdf_id");

-- CreateIndex
CREATE INDEX "pdf_notifications_pdf_id_idx" ON "public"."pdf_notifications"("pdf_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "public"."admin_users"("email");

-- CreateIndex
CREATE INDEX "audit_logs_admin_id_idx" ON "public"."audit_logs"("admin_id");

-- CreateIndex
CREATE INDEX "audit_logs_target_id_idx" ON "public"."audit_logs"("target_id");

-- CreateIndex
CREATE INDEX "support_tickets_user_id_idx" ON "public"."support_tickets"("user_id");

-- CreateIndex
CREATE INDEX "support_tickets_admin_id_idx" ON "public"."support_tickets"("admin_id");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "public"."support_tickets"("status");

-- AddForeignKey
ALTER TABLE "public"."user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_codes" ADD CONSTRAINT "exam_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_results" ADD CONSTRAINT "exam_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_results" ADD CONSTRAINT "exam_results_exam_code_id_fkey" FOREIGN KEY ("exam_code_id") REFERENCES "public"."exam_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analytics" ADD CONSTRAINT "analytics_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "public"."exam_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analytics" ADD CONSTRAINT "analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pdf_solutions" ADD CONSTRAINT "pdf_solutions_upload_admin_id_fkey" FOREIGN KEY ("upload_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pdf_downloads" ADD CONSTRAINT "pdf_downloads_pdf_id_fkey" FOREIGN KEY ("pdf_id") REFERENCES "public"."pdf_solutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pdf_downloads" ADD CONSTRAINT "pdf_downloads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pdf_notifications" ADD CONSTRAINT "pdf_notifications_pdf_id_fkey" FOREIGN KEY ("pdf_id") REFERENCES "public"."pdf_solutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."support_tickets" ADD CONSTRAINT "support_tickets_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
