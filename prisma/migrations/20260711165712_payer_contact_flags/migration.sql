-- CreateEnum
CREATE TYPE "ContactPref" AS ENUM ('WHATSAPP', 'SMS', 'EMAIL');

-- AlterTable
ALTER TABLE "Payer" ADD COLUMN     "contactPref" "ContactPref",
ADD COLUMN     "isEmergencyContactOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSelf" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT;
