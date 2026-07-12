-- CreateTable
CREATE TABLE "MileageLog" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "miles" DECIMAL(6,1) NOT NULL,
    "fromLocationId" TEXT,
    "toLocationId" TEXT,
    "purpose" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MileageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MileageLog_teacherId_date_idx" ON "MileageLog"("teacherId", "date");

-- AddForeignKey
ALTER TABLE "MileageLog" ADD CONSTRAINT "MileageLog_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MileageLog" ADD CONSTRAINT "MileageLog_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "TeachingLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MileageLog" ADD CONSTRAINT "MileageLog_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "TeachingLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

