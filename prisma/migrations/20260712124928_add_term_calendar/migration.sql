-- AlterTable
ALTER TABLE "TeachingLocation" ADD COLUMN     "termCalendarId" TEXT;

-- CreateTable
CREATE TABLE "TermCalendar" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TermCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermPeriod" (
    "id" TEXT NOT NULL,
    "termCalendarId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TermPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HolidayPeriod" (
    "id" TEXT NOT NULL,
    "termCalendarId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HolidayPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TermCalendar_teacherId_idx" ON "TermCalendar"("teacherId");

-- CreateIndex
CREATE INDEX "TermPeriod_termCalendarId_idx" ON "TermPeriod"("termCalendarId");

-- CreateIndex
CREATE INDEX "HolidayPeriod_termCalendarId_idx" ON "HolidayPeriod"("termCalendarId");

-- AddForeignKey
ALTER TABLE "TeachingLocation" ADD CONSTRAINT "TeachingLocation_termCalendarId_fkey" FOREIGN KEY ("termCalendarId") REFERENCES "TermCalendar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermCalendar" ADD CONSTRAINT "TermCalendar_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermPeriod" ADD CONSTRAINT "TermPeriod_termCalendarId_fkey" FOREIGN KEY ("termCalendarId") REFERENCES "TermCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HolidayPeriod" ADD CONSTRAINT "HolidayPeriod_termCalendarId_fkey" FOREIGN KEY ("termCalendarId") REFERENCES "TermCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
