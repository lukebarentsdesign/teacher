-- CreateEnum
CREATE TYPE "StudentCurriculumStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED');

-- CreateEnum
CREATE TYPE "StudentCurriculumSectionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "LessonNote" ADD COLUMN     "studentCurriculumSectionId" TEXT;

-- CreateTable
CREATE TABLE "CurriculumTemplate" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lessonTypeId" TEXT,

    CONSTRAINT "CurriculumTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumSection" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimatedLessons" INTEGER,

    CONSTRAINT "CurriculumSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentCurriculum" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "subject" TEXT,
    "startedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StudentCurriculumStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentCurriculum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentCurriculumSection" (
    "id" TEXT NOT NULL,
    "studentCurriculumId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimatedLessons" INTEGER,
    "status" "StudentCurriculumSectionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completedDate" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "StudentCurriculumSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CurriculumTemplate_teacherId_idx" ON "CurriculumTemplate"("teacherId");

-- CreateIndex
CREATE INDEX "CurriculumSection_templateId_idx" ON "CurriculumSection"("templateId");

-- CreateIndex
CREATE INDEX "StudentCurriculum_studentId_idx" ON "StudentCurriculum"("studentId");

-- CreateIndex
CREATE INDEX "StudentCurriculumSection_studentCurriculumId_idx" ON "StudentCurriculumSection"("studentCurriculumId");

-- AddForeignKey
ALTER TABLE "LessonNote" ADD CONSTRAINT "LessonNote_studentCurriculumSectionId_fkey" FOREIGN KEY ("studentCurriculumSectionId") REFERENCES "StudentCurriculumSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumTemplate" ADD CONSTRAINT "CurriculumTemplate_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumTemplate" ADD CONSTRAINT "CurriculumTemplate_lessonTypeId_fkey" FOREIGN KEY ("lessonTypeId") REFERENCES "LessonType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumSection" ADD CONSTRAINT "CurriculumSection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CurriculumTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCurriculum" ADD CONSTRAINT "StudentCurriculum_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCurriculum" ADD CONSTRAINT "StudentCurriculum_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CurriculumTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCurriculumSection" ADD CONSTRAINT "StudentCurriculumSection_studentCurriculumId_fkey" FOREIGN KEY ("studentCurriculumId") REFERENCES "StudentCurriculum"("id") ON DELETE CASCADE ON UPDATE CASCADE;
