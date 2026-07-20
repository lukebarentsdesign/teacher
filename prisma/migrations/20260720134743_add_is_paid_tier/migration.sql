-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "billingFrequency" TEXT;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "invoiceStripeLink" TEXT,
ADD COLUMN     "isPaidTier" BOOLEAN NOT NULL DEFAULT false;
