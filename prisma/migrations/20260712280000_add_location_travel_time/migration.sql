-- CreateTable
CREATE TABLE "LocationTravelTime" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "fromLocationId" TEXT NOT NULL,
    "toLocationId" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationTravelTime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LocationTravelTime_teacherId_fromLocationId_toLocationId_key" ON "LocationTravelTime"("teacherId", "fromLocationId", "toLocationId");

-- AddForeignKey
ALTER TABLE "LocationTravelTime" ADD CONSTRAINT "LocationTravelTime_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationTravelTime" ADD CONSTRAINT "LocationTravelTime_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "TeachingLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationTravelTime" ADD CONSTRAINT "LocationTravelTime_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "TeachingLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

