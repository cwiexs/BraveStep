-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "BodyType" AS ENUM ('ectomorph', 'mesomorph', 'endomorph', 'unknown');

-- CreateEnum
CREATE TYPE "FitnessLevel" AS ENUM ('beginner', 'intermediate', 'advanced');

-- CreateEnum
CREATE TYPE "PhysicalActivityLevel" AS ENUM ('very_low', 'low', 'medium', 'high', 'very_high');

-- CreateEnum
CREATE TYPE "WorkSchedule" AS ENUM ('early', 'late', 'shift', 'flexible', 'normal');

-- CreateEnum
CREATE TYPE "WorkoutLocation" AS ENUM ('home', 'gym', 'outdoor', 'other');

-- CreateEnum
CREATE TYPE "PlanUpdateFrequency" AS ENUM ('weekly', 'monthly', 'quarterly');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50),
    "email" VARCHAR(100) NOT NULL,
    "password" TEXT NOT NULL,
    "phone" VARCHAR(20),
    "preferredLanguage" VARCHAR(5),
    "profilePhotoUrl" VARCHAR(250),
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "city" VARCHAR(50),
    "country" VARCHAR(50),
    "address" VARCHAR(100),
    "heightCm" SMALLINT,
    "weightKg" DECIMAL(5,2),
    "bodyType" "BodyType",
    "fitnessLevel" "FitnessLevel",
    "healthConditions" VARCHAR(100)[],
    "allergies" VARCHAR(100)[],
    "foodRestrictions" VARCHAR(50)[],
    "jobType" VARCHAR(50),
    "workHoursPerDay" DOUBLE PRECISION,
    "workSchedule" "WorkSchedule",
    "wakeUpTime" VARCHAR(5),
    "bedTime" VARCHAR(5),
    "sleepHours" DOUBLE PRECISION,
    "familyStatus" VARCHAR(50),
    "mealsPerDay" SMALLINT,
    "eatsOutOften" BOOLEAN,
    "favoriteActivities" VARCHAR(50)[],
    "gymMember" BOOLEAN,
    "physicalActivityLevel" "PhysicalActivityLevel",
    "stepsPerDay" INTEGER,
    "currentSports" VARCHAR(50)[],
    "newActivitiesInterest" VARCHAR(50)[],
    "minutesPerWorkout" INTEGER,
    "workoutsPerWeek" INTEGER,
    "workoutLocation" "WorkoutLocation",
    "equipmentAvailable" VARCHAR(50)[],
    "dietType" VARCHAR(50),
    "favoriteFoods" VARCHAR(50)[],
    "dislikedFoods" VARCHAR(50)[],
    "cuisinePreference" VARCHAR(50)[],
    "supplements" VARCHAR(50)[],
    "eatingHabits" VARCHAR(100),
    "coffeePerDay" INTEGER,
    "teaPerDay" INTEGER,
    "sugarPerDay" INTEGER,
    "motivationLevel" INTEGER,
    "mainObstacles" VARCHAR(200),
    "notifications" BOOLEAN,
    "successDefinition" VARCHAR(200),
    "previousFitnessExperience" VARCHAR(200),
    "planUpdateFrequency" "PlanUpdateFrequency",
    "hasInsurance" BOOLEAN,
    "smokes" BOOLEAN,
    "alcohol" VARCHAR(50),
    "stressLevel" INTEGER,
    "medications" VARCHAR(100)[],
    "smartWatch" BOOLEAN,
    "goal" VARCHAR(100),
    "goalDeadline" TIMESTAMP(3),
    "wantsRestRecommendations" BOOLEAN,
    "accessLevel" INTEGER DEFAULT 0,
    "additionalNotes" VARCHAR(500),
    "preferredContactTime" VARCHAR(20),
    "referralSource" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
