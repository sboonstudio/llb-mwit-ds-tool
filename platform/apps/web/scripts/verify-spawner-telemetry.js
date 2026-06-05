const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function verifySpawnerEvents() {
  try {
    console.log("--- Checking Container Lifecycle Events (LAB_SPAWN / LAB_STOP) ---");
    const spawnerLogs = await prisma.activityLog.findMany({
      where: {
        action: { in: ["LAB_SPAWN", "LAB_STOP"] }
      },
      orderBy: { timestamp: "desc" },
      take: 10,
      include: { user: { select: { email: true } } }
    });

    if (spawnerLogs.length === 0) {
      console.log("No spawner events found in ActivityLog.");
    } else {
      spawnerLogs.forEach(log => {
        console.log(`[${log.timestamp.toISOString()}] ${log.action.padEnd(10)} | User: ${log.user?.email || "Unknown"} | Details: ${log.details}`);
      });
    }

    console.log("\n--- Checking Container Resource Metrics (CPU / Memory) ---");
    const metrics = await prisma.resourceUsage.findMany({
      orderBy: { recordedAt: "desc" },
      take: 10,
      include: { user: { select: { email: true } } }
    });

    if (metrics.length === 0) {
      console.log("No resource metrics found in ResourceUsage table.");
    } else {
      metrics.forEach(m => {
        console.log(`[${m.recordedAt.toISOString()}] User: ${m.user?.email || "Unknown"} | CPU: ${m.cpuUsage}% | Memory: ${m.memoryUsage} MB`);
      });
    }

  } catch (error) {
    console.error("Verification Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySpawnerEvents();
