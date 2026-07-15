ALTER TABLE "TeachingLocation" ADD COLUMN "customLocationType" TEXT;
ALTER TABLE "TeachingLocation" ADD COLUMN "customInvoicingTarget" TEXT;

CREATE TABLE "LocationTypeOption" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "locationType" "LocationType" NOT NULL DEFAULT 'OTHER',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationTypeOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InvoicingTargetOption" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "invoicingTarget" "InvoicingTarget" NOT NULL DEFAULT 'PARENT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoicingTargetOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LocationTypeOption_teacherId_label_key" ON "LocationTypeOption"("teacherId", "label");
CREATE INDEX "LocationTypeOption_teacherId_active_sortOrder_idx" ON "LocationTypeOption"("teacherId", "active", "sortOrder");
CREATE UNIQUE INDEX "InvoicingTargetOption_teacherId_label_key" ON "InvoicingTargetOption"("teacherId", "label");
CREATE INDEX "InvoicingTargetOption_teacherId_active_sortOrder_idx" ON "InvoicingTargetOption"("teacherId", "active", "sortOrder");

ALTER TABLE "LocationTypeOption" ADD CONSTRAINT "LocationTypeOption_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvoicingTargetOption" ADD CONSTRAINT "InvoicingTargetOption_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;