const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function simulateLog() {
  try {
    const user = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!user) {
        console.error("No admin user found for simulation");
        return;
    }
    
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "CELL_EXECUTION",
        details: JSON.stringify({
          event: "CELL_EXECUTION",
          path: "/home/jovyan/work/Welcome.ipynb",
          code: "print('Telemetry System Verified!')",
          success: true,
          execution_count: 101,
          user: user.email
        }),
        timestamp: new Date()
      }
    });
    console.log(`>>> Simulated CELL_EXECUTION log created for user: ${user.email}`);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateLog();
