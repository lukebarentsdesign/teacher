-- CreateTable
CREATE TABLE "EmbedConfig" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "locationId" TEXT,
    "brandColor" TEXT,
    "embedToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmbedConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EmbedConfigToLessonType" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EmbedConfigToLessonType_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmbedConfig_embedToken_key" ON "EmbedConfig"("embedToken");

-- CreateIndex
CREATE INDEX "EmbedConfig_teacherId_idx" ON "EmbedConfig"("teacherId");

-- CreateIndex
CREATE INDEX "_EmbedConfigToLessonType_B_index" ON "_EmbedConfigToLessonType"("B");

-- AddForeignKey
ALTER TABLE "EmbedConfig" ADD CONSTRAINT "EmbedConfig_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbedConfig" ADD CONSTRAINT "EmbedConfig_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "TeachingLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EmbedConfigToLessonType" ADD CONSTRAINT "_EmbedConfigToLessonType_A_fkey" FOREIGN KEY ("A") REFERENCES "EmbedConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EmbedConfigToLessonType" ADD CONSTRAINT "_EmbedConfigToLessonType_B_fkey" FOREIGN KEY ("B") REFERENCES "LessonType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

