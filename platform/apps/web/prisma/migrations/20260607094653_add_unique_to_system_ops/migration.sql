/*
  Warnings:

  - A unique constraint covering the columns `[date,userId,actionGroup,actionType]` on the table `SystemOpsStats` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SystemOpsStats_date_userId_actionGroup_actionType_key" ON "SystemOpsStats"("date", "userId", "actionGroup", "actionType");
