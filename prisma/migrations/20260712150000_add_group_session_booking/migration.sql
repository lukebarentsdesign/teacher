-- CreateEnum
CREATE TYPE "GroupBookingStatus" AS ENUM ('CONFIRMED', 'WAITLISTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "GroupClass" ADD COLUMN     "capacity" INTEGER;

-- CreateTable
CREATE TABLE "GroupSessionBooking" (
    "id" TEXT NOT NULL,
    "groupClassId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionDate" DATE NOT NULL,
    "status" "GroupBookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupSessionBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupSessionBooking_groupClassId_sessionDate_idx" ON "GroupSessionBooking"("groupClassId", "sessionDate");

-- CreateIndex
CREATE UNIQUE INDEX "GroupSessionBooking_groupClassId_studentId_sessionDate_key" ON "GroupSessionBooking"("groupClassId", "studentId", "sessionDate");

-- AddForeignKey
ALTER TABLE "GroupSessionBooking" ADD CONSTRAINT "GroupSessionBooking_groupClassId_fkey" FOREIGN KEY ("groupClassId") REFERENCES "GroupClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupSessionBooking" ADD CONSTRAINT "GroupSessionBooking_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

