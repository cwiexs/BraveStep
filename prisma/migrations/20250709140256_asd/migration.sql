/*
  Warnings:

  - You are about to alter the column `fitnessLevel` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `VarChar(100)`.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "fitnessLevel" DROP NOT NULL,
ALTER COLUMN "fitnessLevel" SET DATA TYPE VARCHAR(100);
