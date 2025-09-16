-- AlterTable
ALTER TABLE "public"."exam_results" ALTER COLUMN "expires_at" SET DEFAULT NOW() + INTERVAL '6 months';

-- CreateIndex
CREATE INDEX "exam_results_expires_at_idx" ON "public"."exam_results"("expires_at");

-- CreateIndex
CREATE INDEX "users_thai_name_idx" ON "public"."users"("thai_name");

-- CreateIndex
CREATE INDEX "users_school_idx" ON "public"."users"("school");
