const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkLogs() {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 10,
    });
    console.log(JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLogs();
