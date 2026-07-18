-- CreateTable
CREATE TABLE "QuickInvoice" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "invoiceRef" TEXT NOT NULL,
    "billingMode" TEXT NOT NULL DEFAULT 'upfront',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "lessonsCount" INTEGER NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "costPerLesson" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "paidAmount" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'unpaid',
    "emailedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuickInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuickInvoiceLessonDate" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuickInvoiceLessonDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuickInvoice_teacherId_idx" ON "QuickInvoice"("teacherId");

-- CreateIndex
CREATE INDEX "QuickInvoice_studentId_idx" ON "QuickInvoice"("studentId");

-- CreateIndex
CREATE INDEX "QuickInvoice_status_idx" ON "QuickInvoice"("status");

-- CreateIndex
CREATE INDEX "QuickInvoiceLessonDate_invoiceId_idx" ON "QuickInvoiceLessonDate"("invoiceId");

-- AddForeignKey
ALTER TABLE "QuickInvoice" ADD CONSTRAINT "QuickInvoice_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuickInvoice" ADD CONSTRAINT "QuickInvoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuickInvoiceLessonDate" ADD CONSTRAINT "QuickInvoiceLessonDate_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "QuickInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;