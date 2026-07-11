-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "gmailConnected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gmailConnectedEmail" TEXT,
ADD COLUMN     "gmailRefreshTokenEncrypted" TEXT,
ADD COLUMN     "gmailTokenUpdatedAt" TIMESTAMP(3);
