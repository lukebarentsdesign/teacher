-- AlterTable
ALTER TABLE "Organisation" ADD COLUMN "authOrganizationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_authOrganizationId_key" ON "Organisation"("authOrganizationId");
