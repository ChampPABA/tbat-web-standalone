/*
  Warnings:

  - You are about to drop the `email_verifications` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."email_verifications" DROP CONSTRAINT "email_verifications_user_id_fkey";

-- DropTable
DROP TABLE "public"."email_verifications";
