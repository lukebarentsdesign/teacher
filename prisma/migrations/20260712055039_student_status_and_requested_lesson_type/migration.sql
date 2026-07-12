-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('PENDING_REVIEW', 'ACTIVE', 'DECLINED');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "requestedLessonTypeId" TEXT,
ADD COLUMN     "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE';

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_requestedLessonTypeId_fkey" FOREIGN KEY ("requestedLessonTypeId") REFERENCES "LessonType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
