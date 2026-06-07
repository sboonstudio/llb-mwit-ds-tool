import prisma from "./prisma";
import path from "path";

/**
 * Processing Logic for Learning Intelligence
 * สรุปผลข้อมูลจาก ActivityLog ลงตาราง Aggregation
 */

export async function syncIntelligence() {
  console.log(">>> Starting Intelligence Synchronization...");

  // 1. ดึง Log ทั้งหมด (หรือดึงเฉพาะช่วงเวลาที่ต้องการ ในที่นี้ขอเริ่มที่ทั้งหมดเพื่อความแม่นยำ)
  // ในอนาคตควรเก็บ Checkpoint ว่าประมวลผลถึง ID ไหนแล้ว
  const logs = await prisma.activityLog.findMany({
    orderBy: { timestamp: "asc" },
  });

  if (logs.length === 0) return { success: true, processed: 0 };

  let processedCount = 0;

  for (const log of logs) {
    const date = new Date(log.timestamp);
    date.setHours(0, 0, 0, 0); // ตั้งค่าเป็น 00:00 ของวันนั้น

    const userId = log.userId;
    if (!userId) continue;

    // --- A. ประมวลผลการรันโค้ด (ExecutionStats) ---
    if (log.action === "CELL_EXECUTION") {
      try {
        const details = JSON.parse(log.details || "{}");
        const filePath = details.path || "unknown";
        const fileName = path.basename(filePath);
        
        // สกัดนามสกุลไฟล์
        const fileExtension = fileName.includes(".") 
          ? fileName.split(".").pop()?.toLowerCase() || "" 
          : "no-ext";
        
        // ตรวจสอบว่าเป็นไฟล์ที่ต้องการติดตามหรือไม่ (.ipynb, .py, .c, .cpp, .r)
        const trackedExtensions = ["ipynb", "py", "c", "cpp", "r"];
        if (trackedExtensions.includes(fileExtension)) {
          // หาชื่อ Folder (Topic) - เน้นโฟลเดอร์ระดับบนที่จัดกลุ่มบทเรียน
          const pathParts = filePath.split("/").filter((p: string) => p && p !== ".");
          let folderName = "root";
          if (pathParts.length > 1) {
              // กรณีอยู่ในโฟลเดอร์: เช่น 'lab01/intro.ipynb' -> folderName = 'lab01'
              folderName = pathParts[0]; 
          }

          const isSuccess = details.success !== false;
          const errorType = details.error_name || (isSuccess ? null : "UnknownError");

          // อัปเดต ExecutionStats (Aggregation โดยใช้ Date, User, และ FilePath)
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

          // หากมี Error ให้อัปเดต ErrorAnalytics
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
      // กลุ่ม Environment Lifecycle (ยกระดับการวิเคราะห์ความพร้อม)
      "SPAWN_LAB": { group: "ENV_LIFECYCLE", type: "READY_LAB" },
      "LAB_SPAWN": { group: "ENV_LIFECYCLE", type: "READY_LAB" },
      "KERNEL_START": { group: "ENV_LIFECYCLE", type: "READY_KERNEL" },
      "LAB_STOP": { group: "ENV_LIFECYCLE", type: "STOP_ENV" },
      "STOP_LAB": { group: "ENV_LIFECYCLE", type: "STOP_ENV" },
      "KERNEL_STOP": { group: "ENV_LIFECYCLE", type: "STOP_ENV" },
      "RESTART_LAB": { group: "ENV_LIFECYCLE", type: "RESTART" },

      // กลุ่ม Workspace (การจัดการไฟล์)
      "CREATE_FILE": { group: "WORKSPACE", type: "CREATE" },
      "DELETE_FILE": { group: "WORKSPACE", type: "DELETE" },
      "RENAME_FILE": { group: "WORKSPACE", type: "RENAME" },
      "MOVE_FILE": { group: "WORKSPACE", type: "MOVE" },
    };

    // ตรวจสอบทั้ง Action ตรงๆ และ Action ที่อาจจะมาในรูปแบบ string อื่นๆ
    let matchedAction = systemActions[log.action];
    
    // เคสพิเศษสำหรับ JupyterHub Launch
    if (!matchedAction && log.action.includes("JupyterHub Launch")) {
        matchedAction = { group: "ENV_LIFECYCLE", type: "READY_LAB" };
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

    // --- C. ประมวลผลสถิติรายวัน (DailyUserStats) ---
    // (ในเวอร์ชันนี้เน้น Session Count ก่อน ส่วน Active Minutes จะใช้การคำนวณที่ซับซ้อนขึ้นในภายหลัง)
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
  }

  console.log(`>>> Intelligence Synchronization Completed. Processed ${processedCount} logs.`);
  return { success: true, processed: processedCount };
}
