/*
  Warnings:

  - Changed the type of `event_type` on the `security_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."SecurityEventType" AS ENUM ('LOGIN_ATTEMPT', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE', 'ACCOUNT_LOCKED', 'PDPA_CONSENT_GRANTED', 'PDPA_CONSENT_REVOKED', 'UNAUTHORIZED_ACCESS', 'RATE_LIMIT_EXCEEDED', 'SUSPICIOUS_ACTIVITY', 'AUTHENTICATION_SUCCESS', 'AUTHENTICATION_FAILED', 'PASSWORD_RESET_REQUEST', 'EMAIL_VERIFICATION', 'MULTIPLE_LOGIN_ATTEMPTS', 'PDF_UNAUTHORIZED_ACCESS', 'ADMIN_DATA_ACCESS', 'DATA_EXPORT', 'DATA_DELETION');

-- CreateEnum
CREATE TYPE "public"."AvailabilityStatus" AS ENUM ('AVAILABLE', 'LIMITED', 'FULL', 'CLOSED');

-- AlterTable
ALTER TABLE "public"."exam_results" ADD COLUMN     "score" DOUBLE PRECISION,
ADD COLUMN     "subject" "public"."Subject",
ADD COLUMN     "total_questions" INTEGER;

-- AlterTable
ALTER TABLE "public"."security_logs" DROP COLUMN "event_type",
ADD COLUMN     "event_type" "public"."SecurityEventType" NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "grade" TEXT,
ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "parent_name" TEXT,
ADD COLUMN     "parent_phone" TEXT;

-- CreateTable
CREATE TABLE "public"."packages" (
    "id" TEXT NOT NULL,
    "type" "public"."PackageType" NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'thb',
    "features" TEXT[],
    "description" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_packages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "package_type" "public"."PackageType" NOT NULL,
    "session_time" "public"."SessionTime" NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."capacity_status" (
    "id" TEXT NOT NULL,
    "session_time" "public"."SessionTime" NOT NULL,
    "exam_date" TIMESTAMP(3) NOT NULL,
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "free_count" INTEGER NOT NULL DEFAULT 0,
    "advanced_count" INTEGER NOT NULL DEFAULT 0,
    "max_capacity" INTEGER NOT NULL DEFAULT 300,
    "free_limit" INTEGER NOT NULL DEFAULT 150,
    "availability_status" "public"."AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capacity_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "packages_type_key" ON "public"."packages"("type");

-- CreateIndex
CREATE INDEX "user_packages_user_id_idx" ON "public"."user_packages"("user_id");

-- CreateIndex
CREATE INDEX "user_packages_package_type_idx" ON "public"."user_packages"("package_type");

-- CreateIndex
CREATE INDEX "user_packages_session_time_idx" ON "public"."user_packages"("session_time");

-- CreateIndex
CREATE INDEX "user_packages_package_type_session_time_idx" ON "public"."user_packages"("package_type", "session_time");

-- CreateIndex
CREATE INDEX "user_packages_session_time_registered_at_idx" ON "public"."user_packages"("session_time", "registered_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_packages_user_id_package_type_session_time_key" ON "public"."user_packages"("user_id", "package_type", "session_time");

-- CreateIndex
CREATE INDEX "capacity_status_session_time_idx" ON "public"."capacity_status"("session_time");

-- CreateIndex
CREATE INDEX "capacity_status_availability_status_idx" ON "public"."capacity_status"("availability_status");

-- CreateIndex
CREATE UNIQUE INDEX "capacity_status_session_time_exam_date_key" ON "public"."capacity_status"("session_time", "exam_date");

-- CreateIndex
CREATE INDEX "exam_codes_package_type_session_time_idx" ON "public"."exam_codes"("package_type", "session_time");

-- CreateIndex
CREATE INDEX "exam_codes_user_id_package_type_idx" ON "public"."exam_codes"("user_id", "package_type");

-- CreateIndex
CREATE INDEX "exam_codes_session_time_created_at_idx" ON "public"."exam_codes"("session_time", "created_at");

-- CreateIndex
CREATE INDEX "security_logs_event_type_idx" ON "public"."security_logs"("event_type");

-- CreateIndex
CREATE INDEX "session_capacities_session_time_idx" ON "public"."session_capacities"("session_time");

-- CreateIndex
CREATE INDEX "session_capacities_exam_date_idx" ON "public"."session_capacities"("exam_date");

-- CreateIndex
CREATE INDEX "session_capacities_current_count_idx" ON "public"."session_capacities"("current_count");

-- AddForeignKey
ALTER TABLE "public"."user_packages" ADD CONSTRAINT "user_packages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
