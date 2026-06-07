import { PrismaClient } from "@prisma/client";
import path from "path";

const prisma = new PrismaClient();

async function syncIntelligence() {
  console.log(">>> Starting Intelligence Synchronization (Test Script)...");

  // 1. ดึง Log ทั้งหมด
  const logs = await prisma.activityLog.findMany({
    orderBy: { timestamp: "asc" },
  });

  if (logs.length === 0) {
      console.log("No logs found.");
      return;
  }

  let processedCount = 0;

  for (const log of logs) {
    const date = new Date(log.timestamp);
    date.setHours(0, 0, 0, 0); 

    const userId = log.userId;
    if (!userId) continue;

    // A. ExecutionStats
    if (log.action === "CELL_EXECUTION") {
      try {
        const details = JSON.parse(log.details || "{}");
        const filePath = details.path || "unknown";
        const fileName = filePath.split('/').pop();
        const fileExtension = fileName.includes(".") ? fileName.split(".").pop() : "no-ext";
        
        const pathParts = filePath.split("/");
        const folderName = pathParts.length > 1 ? pathParts[pathParts.length - 2] : "root";

        const isSuccess = details.success !== false;
        const errorType = details.error_name || (isSuccess ? null : "UnknownError");

        await prisma.executionStats.upsert({
          where: {
            date_userId_filePath: {
              date,
              userId,
              filePath,
            },
          },
          update: {
            successCount: { increment: isSuccess ? 1 : 0 },
            errorCount: { increment: isSuccess ? 0 : 1 },
          },
          create: {
            date,
            userId,
            filePath,
            fileName,
            fileExtension,
            folderName,
            successCount: isSuccess ? 1 : 0,
            errorCount: isSuccess ? 0 : 1,
          },
        });

        if (!isSuccess && errorType) {
          await prisma.errorAnalytics.upsert({
            where: {
              date_errorType: {
                date,
                errorType,
              },
            },
            update: {
              count: { increment: 1 },
              sampleCode: details.code || null,
            },
            create: {
              date,
              errorType,
              count: 1,
              sampleCode: details.code || null,
            },
          });
        }
      } catch (e) {
        console.error("Error parsing log:", e);
      }
    }

    // B. SystemOpsStats
    const systemActions = {
      "SPAWN_LAB": { group: "LIFECYCLE", type: "START" },
      "STOP_LAB": { group: "LIFECYCLE", type: "STOP" },
    };

    let matchedAction = systemActions[log.action];
    if (!matchedAction && log.action.includes("JupyterHub Launch")) {
        matchedAction = { group: "LIFECYCLE", type: "START" };
    }

    if (matchedAction) {
      await prisma.systemOpsStats.create({
        data: {
          date,
          userId,
          actionGroup: matchedAction.group,
          actionType: matchedAction.type,
          count: 1,
        },
      });
    }

    processedCount++;
  }

  console.log(`>>> Done. Processed ${processedCount} logs.`);
  
  // ตรวจสอบผลลัพธ์
  const execStats = await prisma.executionStats.count();
  const errorStats = await prisma.errorAnalytics.count();
  const sysStats = await prisma.systemOpsStats.count();
  
  console.log(`--- Stats Summary ---`);
  console.log(`ExecutionStats: ${execStats}`);
  console.log(`ErrorAnalytics: ${errorStats}`);
  console.log(`SystemOpsStats: ${sysStats}`);
}

syncIntelligence()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
