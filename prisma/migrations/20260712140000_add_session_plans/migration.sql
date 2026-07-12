-- AlterTable
ALTER TABLE "TeachingLocation" ADD COLUMN     "displayToken" TEXT;

-- CreateTable
CREATE TABLE "SessionPlanTemplate" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionPlanTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionPlan" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT,
    "groupClassId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessionPlanTemplate_teacherId_idx" ON "SessionPlanTemplate"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionPlan_lessonId_key" ON "SessionPlan"("lessonId");

-- CreateIndex
CREATE INDEX "SessionPlan_groupClassId_createdAt_idx" ON "SessionPlan"("groupClassId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeachingLocation_displayToken_key" ON "TeachingLocation"("displayToken");

-- AddForeignKey
ALTER TABLE "SessionPlanTemplate" ADD CONSTRAINT "SessionPlanTemplate_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPlan" ADD CONSTRAINT "SessionPlan_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPlan" ADD CONSTRAINT "SessionPlan_groupClassId_fkey" FOREIGN KEY ("groupClassId") REFERENCES "GroupClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

