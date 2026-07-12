-- CreateEnum
CREATE TYPE "CancellationAction" AS ENUM ('FULL_CHARGE', 'PARTIAL_CHARGE', 'CREDIT', 'FORFEIT');

-- AlterEnum
ALTER TYPE "LedgerReason" ADD VALUE 'LATE_CANCELLATION_CHARGE';

-- CreateTable
CREATE TABLE "CancellationPolicy" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "locationId" TEXT,
    "noticeHoursRequired" INTEGER NOT NULL,
    "lateCancelAction" "CancellationAction" NOT NULL,
    "noShowAction" "CancellationAction" NOT NULL,
    "partialChargePercent" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CancellationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CancellationPolicy_locationId_key" ON "CancellationPolicy"("locationId");

-- CreateIndex
CREATE INDEX "CancellationPolicy_teacherId_idx" ON "CancellationPolicy"("teacherId");

-- AddForeignKey
ALTER TABLE "CancellationPolicy" ADD CONSTRAINT "CancellationPolicy_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancellationPolicy" ADD CONSTRAINT "CancellationPolicy_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "TeachingLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

