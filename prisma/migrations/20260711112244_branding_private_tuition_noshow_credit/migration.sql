-- CreateEnum
CREATE TYPE "PrivateTuitionRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "noShowConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "noShowReason" TEXT;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "primaryColor" TEXT,
ADD COLUMN     "secondaryColor" TEXT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "creditAppliedNextPeriod" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "autoApplyCreditToNextPayment" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "personalBrandColor" TEXT,
ADD COLUMN     "personalBrandLogoUrl" TEXT;

-- CreateTable
CREATE TABLE "PrivateTuitionRequest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "sourceSchoolId" TEXT NOT NULL,
    "status" "PrivateTuitionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultingStudentId" TEXT,

    CONSTRAINT "PrivateTuitionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MakeUpLesson" (
    "id" TEXT NOT NULL,
    "originalLessonId" TEXT NOT NULL,
    "makeUpLessonId" TEXT,
    "studentId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MakeUpLesson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrivateTuitionRequest_studentId_status_idx" ON "PrivateTuitionRequest"("studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MakeUpLesson_originalLessonId_key" ON "MakeUpLesson"("originalLessonId");

-- CreateIndex
CREATE UNIQUE INDEX "MakeUpLesson_makeUpLessonId_key" ON "MakeUpLesson"("makeUpLessonId");

-- CreateIndex
CREATE INDEX "MakeUpLesson_studentId_completedAt_idx" ON "MakeUpLesson"("studentId", "completedAt");

-- AddForeignKey
ALTER TABLE "PrivateTuitionRequest" ADD CONSTRAINT "PrivateTuitionRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateTuitionRequest" ADD CONSTRAINT "PrivateTuitionRequest_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateTuitionRequest" ADD CONSTRAINT "PrivateTuitionRequest_sourceSchoolId_fkey" FOREIGN KEY ("sourceSchoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MakeUpLesson" ADD CONSTRAINT "MakeUpLesson_originalLessonId_fkey" FOREIGN KEY ("originalLessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MakeUpLesson" ADD CONSTRAINT "MakeUpLesson_makeUpLessonId_fkey" FOREIGN KEY ("makeUpLessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MakeUpLesson" ADD CONSTRAINT "MakeUpLesson_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
