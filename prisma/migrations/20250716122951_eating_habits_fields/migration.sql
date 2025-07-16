/*
  Warnings:

  - You are about to drop the column `eatingHabits` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `eatsOutOften` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `hasInsurance` on the `users` table. All the data in the column will be lost.
  - You are about to alter the column `healthConditions` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `VarChar(100)`.
  - You are about to alter the column `allergies` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `VarChar(100)`.
  - You are about to alter the column `foodRestrictions` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(50)`.
  - You are about to alter the column `favoriteFoods` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(50)`.
  - You are about to alter the column `dislikedFoods` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(50)`.
  - You are about to alter the column `cuisinePreference` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(50)`.
  - You are about to alter the column `supplements` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(50)`.
  - You are about to alter the column `medications` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `VarChar(100)`.
  - The `fitnessLevel` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "GeneratedPlan" ADD COLUMN     "completionStatus" JSONB,
ADD COLUMN     "feedbackNotes" VARCHAR(500),
ADD COLUMN     "modifiedPlanData" JSONB;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "eatingHabits",
DROP COLUMN "eatsOutOften",
DROP COLUMN "hasInsurance",
ADD COLUMN     "eatingHabitsAnalysis" JSONB,
ADD COLUMN     "eatingHabitsAnalysisDate" TIMESTAMP(3),
ALTER COLUMN "healthConditions" DROP NOT NULL,
ALTER COLUMN "healthConditions" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "allergies" DROP NOT NULL,
ALTER COLUMN "allergies" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "foodRestrictions" DROP NOT NULL,
ALTER COLUMN "foodRestrictions" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "favoriteFoods" DROP NOT NULL,
ALTER COLUMN "favoriteFoods" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "dislikedFoods" DROP NOT NULL,
ALTER COLUMN "dislikedFoods" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "cuisinePreference" DROP NOT NULL,
ALTER COLUMN "cuisinePreference" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "supplements" DROP NOT NULL,
ALTER COLUMN "supplements" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "medications" DROP NOT NULL,
ALTER COLUMN "medications" SET DATA TYPE VARCHAR(100),
DROP COLUMN "fitnessLevel",
ADD COLUMN     "fitnessLevel" "FitnessLevel";

-- CreateTable
CREATE TABLE "ArchivedPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "originalPlan" JSONB NOT NULL,
    "modifiedPlan" JSONB,
    "feedback" VARCHAR(500),
    "completionStatus" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivedPlan_pkey" PRIMARY KEY ("id")
);
