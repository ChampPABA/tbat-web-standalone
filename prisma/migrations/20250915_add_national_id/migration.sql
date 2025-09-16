-- AlterTable
ALTER TABLE "users" ADD COLUMN "national_id" VARCHAR(13);

-- CreateIndex
CREATE UNIQUE INDEX "users_national_id_key" ON "users"("national_id");