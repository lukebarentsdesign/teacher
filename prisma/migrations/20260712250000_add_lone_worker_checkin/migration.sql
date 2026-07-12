-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "emergencyContactEmail" TEXT,
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT;

-- CreateTable
CREATE TABLE "LoneWorkerCheckIn" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "checkedInAt" TIMESTAMP(3),
    "checkedOutAt" TIMESTAMP(3),
    "expectedEndAt" TIMESTAMP(3) NOT NULL,
    "graceMinutes" INTEGER NOT NULL DEFAULT 15,
    "alertSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoneWorkerCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoneWorkerCheckIn_lessonId_key" ON "LoneWorkerCheckIn"("lessonId");

-- AddForeignKey
ALTER TABLE "LoneWorkerCheckIn" ADD CONSTRAINT "LoneWorkerCheckIn_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

