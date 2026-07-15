ALTER TYPE "ResourceType" ADD VALUE IF NOT EXISTS 'IMAGE';

ALTER TABLE "Resource" ADD COLUMN "folder" TEXT;
ALTER TABLE "Resource" ADD COLUMN "sourceLabel" TEXT;
ALTER TABLE "Resource" ADD COLUMN "tags" TEXT;
ALTER TABLE "Resource" ADD COLUMN "thumbnailUrl" TEXT;
ALTER TABLE "Resource" ADD COLUMN "pinned" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Resource_teacherId_folder_idx" ON "Resource"("teacherId", "folder");
CREATE INDEX "Resource_teacherId_pinned_createdAt_idx" ON "Resource"("teacherId", "pinned", "createdAt");