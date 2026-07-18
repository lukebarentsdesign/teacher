ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "invoiceEmailSubjectTemplate" TEXT;
ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "invoiceEmailBodyTemplate" TEXT;