-- CreateTable
CREATE TABLE "LessonType" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultDurationMinutes" INTEGER NOT NULL,
    "defaultFee" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LessonTypeToTeachingLocation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LessonTypeToTeachingLocation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "LessonType_teacherId_idx" ON "LessonType"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonType_teacherId_name_key" ON "LessonType"("teacherId", "name");

-- CreateIndex
CREATE INDEX "_LessonTypeToTeachingLocation_B_index" ON "_LessonTypeToTeachingLocation"("B");

-- AddForeignKey
ALTER TABLE "LessonType" ADD CONSTRAINT "LessonType_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LessonTypeToTeachingLocation" ADD CONSTRAINT "_LessonTypeToTeachingLocation_A_fkey" FOREIGN KEY ("A") REFERENCES "LessonType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LessonTypeToTeachingLocation" ADD CONSTRAINT "_LessonTypeToTeachingLocation_B_fkey" FOREIGN KEY ("B") REFERENCES "TeachingLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
