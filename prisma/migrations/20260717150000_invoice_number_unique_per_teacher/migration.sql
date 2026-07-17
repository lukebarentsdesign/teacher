-- Invoice numbers are generated per-teacher (e.g. "INV-202607-0001" from each teacher's own running
-- count), so uniqueness must be scoped per-teacher, not global. A global unique index made two
-- different teachers issuing their first invoice in the same month collide (P2002 -> 500 on the
-- second). Replace the global unique index with a composite (teacherId, invoiceNumber) one.

-- DropIndex
DROP INDEX "Invoice_invoiceNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_teacherId_invoiceNumber_key" ON "Invoice"("teacherId", "invoiceNumber");
