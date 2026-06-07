import prisma from "./prisma";
import path from "path";

/**
 * Processing Logic for Learning Intelligence
 * สรุปผลข้อมูลจาก ActivityLog ลงตาราง Aggregation
 */

export async function syncIntelligence() {
  console.log(">>> Starting Intelligence Synchronization...");

  // 1. ดึง Checkpoint ล่าสุดจาก SystemConfig
  const config = await prisma.systemConfig.upsert({
    where: { id: "CURRENT" },
    update: {},
    create: { id: "CURRENT" },
  });

  const lastId = config.lastSyncedLogId;

  // 2. ดึง Log เฉพาะที่ยังไม่ได้ประมวลผล (ID > lastId)
  const logs = await prisma.activityLog.findMany({
    where: lastId ? { id: { gt: lastId } } : {},
    orderBy: { timestamp: "asc" },
  });

  if (logs.length === 0) {
    return { success: true, processed: 0, message: "Already up to date." };
  }

  let processedCount = 0;
  let lastProcessedId = lastId;

  for (const log of logs) {
    const date = new Date(log.timestamp);
    date.setHours(0, 0, 0, 0);

    const userId = log.userId;
    if (!userId) continue;

    // --- A. ประมวลผลการรันโค้ด (ExecutionStats) ---
    if (log.action === "CELL_EXECUTION") {
      try {
        const details = JSON.parse(log.details || "{}");
        const filePath = details.path || "unknown";
        const fileName = path.basename(filePath);
        
        const fileExtension = fileName.includes(".") 
          ? fileName.split(".").pop()?.toLowerCase() || "" 
          : "no-ext";
        
        const trackedExtensions = ["ipynb", "py", "c", "cpp", "r"];
        if (trackedExtensions.includes(fileExtension)) {
          const pathParts = filePath.split("/").filter((p: string) => p && p !== ".");
          let folderName = "root";
          if (pathParts.length > 1) {
              folderName = pathParts[0]; 
          }

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
        }
      } catch (e) {
        console.error("Error parsing CELL_EXECUTION log:", e);
      }
    }

    // --- B. ประมวลผลการจัดการระบบ (SystemOpsStats) ---
    const systemActions: Record<string, { group: string; type: string }> = {
      "SPAWN_LAB": { group: "ENV_LIFECYCLE", type: "READY_LAB" },
      "LAB_SPAWN": { group: "ENV_LIFECYCLE", type: "READY_LAB" },
      "KERNEL_START": { group: "ENV_LIFECYCLE", type: "READY_KERNEL" },
      "LAB_STOP": { group: "ENV_LIFECYCLE", type: "STOP_ENV" },
      "STOP_LAB": { group: "ENV_LIFECYCLE", type: "STOP_ENV" },
      "KERNEL_STOP": { group: "ENV_LIFECYCLE", type: "STOP_ENV" },
      "RESTART_LAB": { group: "ENV_LIFECYCLE", type: "RESTART" },
      "CREATE_FILE": { group: "WORKSPACE", type: "CREATE" },
      "DELETE_FILE": { group: "WORKSPACE", type: "DELETE" },
      "RENAME_FILE": { group: "WORKSPACE", type: "RENAME" },
      "MOVE_FILE": { group: "WORKSPACE", type: "MOVE" },
    };

    let matchedAction = systemActions[log.action];
    if (!matchedAction && log.action.includes("JupyterHub Launch")) {
        matchedAction = { group: "ENV_LIFECYCLE", type: "READY_LAB" };
    }

    if (matchedAction) {
      await prisma.systemOpsStats.upsert({
        where: {
          date_userId_actionGroup_actionType: {
            date,
            userId,
            actionGroup: matchedAction.group,
            actionType: matchedAction.type,
          },
        },
        update: {
          count: { increment: 1 },
        },
        create: {
          date,
          userId,
          actionGroup: matchedAction.group,
          actionType: matchedAction.type,
          count: 1,
        },
      });
    }

    // --- C. ประมวลผลสถิติรายวัน (DailyUserStats) ---
    if (matchedAction?.type === "READY_LAB") {
      await prisma.dailyUserStats.upsert({
        where: {
          date_userId: {
            date,
            userId,
          },
        },
        update: {
          sessionCount: { increment: 1 },
        },
        create: {
          date,
          userId,
          sessionCount: 1,
          activeMinutes: 0,
        },
      });
    }

    processedCount++;
    lastProcessedId = log.id;
  }

  // 3. อัปเดต Checkpoint หลังประมวลผลเสร็จ
  await prisma.systemConfig.update({
    where: { id: "CURRENT" },
    data: {
      lastSyncedLogId: lastProcessedId,
      lastSyncedAt: new Date(),
    },
  });

  console.log(`>>> Intelligence Synchronization Completed. Processed ${processedCount} new logs.`);
  return { success: true, processed: processedCount, lastSyncedAt: new Date() };
}
