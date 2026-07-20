-- AlterEnum
ALTER TYPE "ModuleKey" ADD VALUE 'INVOICING';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "billingFrequency" TEXT;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "invoiceStripeLink" TEXT;
