-- AlterTable
ALTER TABLE "GroupClass" ADD COLUMN     "subjectId" TEXT;

-- AddForeignKey
ALTER TABLE "GroupClass" ADD CONSTRAINT "GroupClass_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
