-- DropIndex
DROP INDEX "Resource_teacherId_folder_idx";

-- DropIndex
DROP INDEX "Resource_teacherId_pinned_createdAt_idx";

-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN     "invoiceId" TEXT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "calculationSnapshot" JSONB;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "businessAddress" TEXT,
ADD COLUMN     "businessName" TEXT,
ADD COLUMN     "invoicePrefix" TEXT,
ADD COLUMN     "paymentInstructions" TEXT;

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "payerId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComingSoonFeedback" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComingSoonFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_teacherId_issueDate_idx" ON "Invoice"("teacherId", "issueDate");

-- CreateIndex
CREATE INDEX "Invoice_payerId_idx" ON "Invoice"("payerId");

-- CreateIndex
CREATE INDEX "ComingSoonFeedback_teacherId_idx" ON "ComingSoonFeedback"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "ComingSoonFeedback_teacherId_featureKey_key" ON "ComingSoonFeedback"("teacherId", "featureKey");

-- CreateIndex
CREATE INDEX "LedgerEntry_invoiceId_idx" ON "LedgerEntry"("invoiceId");

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "Payer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComingSoonFeedback" ADD CONSTRAINT "ComingSoonFeedback_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
