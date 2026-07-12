/*
  Warnings:

  - Added the required column `teacherId` to the `AddOn` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AddOn" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "teacherId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "AddOn_teacherId_idx" ON "AddOn"("teacherId");

-- AddForeignKey
ALTER TABLE "AddOn" ADD CONSTRAINT "AddOn_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
