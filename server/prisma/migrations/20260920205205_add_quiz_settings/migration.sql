-- AlterTable
ALTER TABLE "quizzes" ADD COLUMN     "is_required" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "passing_score" DECIMAL(5,2) NOT NULL DEFAULT 70.00;
