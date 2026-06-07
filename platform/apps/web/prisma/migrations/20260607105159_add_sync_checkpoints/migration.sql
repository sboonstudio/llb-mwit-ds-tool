-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN "lastSyncedAt" DATETIME;
ALTER TABLE "SystemConfig" ADD COLUMN "lastSyncedLogId" TEXT;
