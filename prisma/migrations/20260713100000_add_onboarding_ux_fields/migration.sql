-- CreateEnum
CREATE TYPE "TeacherArchetype" AS ENUM ('SOLO', 'GROUP_INDEPENDENT');

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "teachesGroups" BOOLEAN,
ADD COLUMN     "controlsOwnSchedule" BOOLEAN,
ADD COLUMN     "archetype" "TeacherArchetype",
ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "dismissedCards" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "OutOfScopeSignup" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT,
    "email" TEXT NOT NULL,
    "freeTextAnswer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutOfScopeSignup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OutOfScopeSignup" ADD CONSTRAINT "OutOfScopeSignup_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
