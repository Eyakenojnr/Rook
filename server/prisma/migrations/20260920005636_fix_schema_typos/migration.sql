/*
  Warnings:

  - You are about to drop the column `courrse_id` on the `enrollments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[student_id,course_id]` on the table `enrollments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `course_id` to the `enrollments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_courrse_id_fkey";

-- DropIndex
DROP INDEX "enrollments_student_id_courrse_id_key";

-- AlterTable
ALTER TABLE "enrollments" RENAME COLUMN "courrse_id" TO "course_id";

-- AlterTable
ALTER TABLE "modules" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_student_id_course_id_key" ON "enrollments"("student_id", "course_id");

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
