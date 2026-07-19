-- CreateEnum
CREATE TYPE "ModuleKey" AS ENUM ('ORGANISATION', 'TERM_CALENDARS');

-- CreateEnum
CREATE TYPE "ModuleAccessStatus" AS ENUM ('ENABLED', 'TRIAL', 'LOCKED');

-- CreateTable
CREATE TABLE "TeacherModuleAccess" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "moduleKey" "ModuleKey" NOT NULL,
    "status" "ModuleAccessStatus" NOT NULL DEFAULT 'ENABLED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherModuleAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherModuleAccess_teacherId_idx" ON "TeacherModuleAccess"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherModuleAccess_teacherId_moduleKey_key" ON "TeacherModuleAccess"("teacherId", "moduleKey");

-- AddForeignKey
ALTER TABLE "TeacherModuleAccess" ADD CONSTRAINT "TeacherModuleAccess_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
