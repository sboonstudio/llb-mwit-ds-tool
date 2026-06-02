-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN "details" TEXT;
ALTER TABLE "ActivityLog" ADD COLUMN "ipAddress" TEXT;

-- CreateTable
CREATE TABLE "ResourceUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cpuUsage" REAL NOT NULL,
    "memoryUsage" REAL NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResourceUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
