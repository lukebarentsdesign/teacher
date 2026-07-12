-- CreateEnum
CREATE TYPE "VenueFeeType" AS ENUM ('FLAT_PER_SESSION', 'PERCENT_OF_LESSON_FEE', 'PERIOD_RENTAL');

-- CreateEnum
CREATE TYPE "VenueFeeBillingMode" AS ENUM ('ABSORBED_INTO_FEE', 'ITEMISED_TO_PAYER');

-- AlterEnum
ALTER TYPE "LedgerReason" ADD VALUE 'VENUE_FEE_ITEMISED';

-- CreateTable
CREATE TABLE "VenueFeeArrangement" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "feeType" "VenueFeeType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "billingMode" "VenueFeeBillingMode" NOT NULL DEFAULT 'ABSORBED_INTO_FEE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenueFeeArrangement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonTypeLocationPricing" (
    "id" TEXT NOT NULL,
    "lessonTypeId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "fee" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "LessonTypeLocationPricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VenueFeeArrangement_locationId_idx" ON "VenueFeeArrangement"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonTypeLocationPricing_lessonTypeId_locationId_key" ON "LessonTypeLocationPricing"("lessonTypeId", "locationId");

-- AddForeignKey
ALTER TABLE "VenueFeeArrangement" ADD CONSTRAINT "VenueFeeArrangement_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "TeachingLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonTypeLocationPricing" ADD CONSTRAINT "LessonTypeLocationPricing_lessonTypeId_fkey" FOREIGN KEY ("lessonTypeId") REFERENCES "LessonType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonTypeLocationPricing" ADD CONSTRAINT "LessonTypeLocationPricing_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "TeachingLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
