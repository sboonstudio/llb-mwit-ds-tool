-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'CURRENT',
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "autoRotate" BOOLEAN NOT NULL DEFAULT true,
    "errorThreshold" INTEGER NOT NULL DEFAULT 10,
    "alertWindowMins" INTEGER NOT NULL DEFAULT 60,
    "notifyEmail" TEXT,
    "enableAlerts" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DailyUserStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "activeMinutes" INTEGER NOT NULL DEFAULT 0,
    "sessionCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyUserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExecutionStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileExtension" TEXT NOT NULL,
    "folderName" TEXT NOT NULL,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExecutionStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemOpsStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "actionGroup" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SystemOpsStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ErrorAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "errorType" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "sampleCode" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyUserStats_date_userId_key" ON "DailyUserStats"("date", "userId");

-- CreateIndex
CREATE INDEX "ExecutionStats_fileExtension_idx" ON "ExecutionStats"("fileExtension");

-- CreateIndex
CREATE INDEX "ExecutionStats_folderName_idx" ON "ExecutionStats"("folderName");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutionStats_date_userId_filePath_key" ON "ExecutionStats"("date", "userId", "filePath");

-- CreateIndex
CREATE INDEX "SystemOpsStats_date_actionGroup_idx" ON "SystemOpsStats"("date", "actionGroup");

-- CreateIndex
CREATE INDEX "SystemOpsStats_actionType_idx" ON "SystemOpsStats"("actionType");

-- CreateIndex
CREATE UNIQUE INDEX "ErrorAnalytics_date_errorType_key" ON "ErrorAnalytics"("date", "errorType");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- CreateIndex
CREATE INDEX "ActivityLog_timestamp_idx" ON "ActivityLog"("timestamp");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");
