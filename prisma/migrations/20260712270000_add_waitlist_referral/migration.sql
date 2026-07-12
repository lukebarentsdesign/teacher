-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('WAITING', 'CONTACTED', 'CONVERTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "referredBy" TEXT;

-- CreateTable
CREATE TABLE "TimetableWaitlist" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "lessonTypeId" TEXT,
    "locationId" TEXT,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "notes" TEXT,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'WAITING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimetableWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimetableWaitlist_teacherId_status_idx" ON "TimetableWaitlist"("teacherId", "status");

-- AddForeignKey
ALTER TABLE "TimetableWaitlist" ADD CONSTRAINT "TimetableWaitlist_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableWaitlist" ADD CONSTRAINT "TimetableWaitlist_lessonTypeId_fkey" FOREIGN KEY ("lessonTypeId") REFERENCES "LessonType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableWaitlist" ADD CONSTRAINT "TimetableWaitlist_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "TeachingLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

