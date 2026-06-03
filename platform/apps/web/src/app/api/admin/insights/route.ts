import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // 1. Resource Usage Trend (Last 7 days)
    const usageData = await prisma.resourceUsage.findMany({
      orderBy: { recordedAt: "asc" },
      where: {
        recordedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        cpuUsage: true,
        memoryUsage: true,
        recordedAt: true,
      },
    });

    // 2. Error Distribution from ActivityLogs
    const logs = await prisma.activityLog.findMany({
      where: {
        action: "CELL_EXECUTION",
        details: {
          contains: '"success":false',
        },
      },
      select: { details: true },
    });

    const errorCounts: Record<string, number> = {};
    logs.forEach((log) => {
      if (log.details) {
        try {
          const details = JSON.parse(log.details);
          const errorName = details.error?.split(":")[0] || "Unknown Error";
          errorCounts[errorName] = (errorCounts[errorName] || 0) + 1;
        } catch (e) {}
      }
    });

    const errorDistribution = Object.entries(errorCounts).map(([name, value]) => ({
      name,
      value,
    }));

    // 3. User Engagement (Logins per day)
    const loginLogs = await prisma.activityLog.findMany({
      where: {
        action: "LAB_SPAWN",
      },
      select: { timestamp: true },
    });

    const loginStats: Record<string, number> = {};
    loginLogs.forEach((log) => {
      const date = log.timestamp.toISOString().split("T")[0];
      loginStats[date] = (loginStats[date] || 0) + 1;
    });

    const engagementData = Object.entries(loginStats).map(([date, count]) => [
      date,
      count,
    ]);

    // 4. Most Active Users (by activity count)
    const userActivity = await prisma.activityLog.groupBy({
      by: ["userId"],
      where: { userId: { not: null } }, // Filter out system/anonymous events
      _count: { _all: true },
      orderBy: { _count: { userId: "desc" } },
      take: 5,
    });

    const userIds = userActivity.map((u) => u.userId).filter((id): id is string => id !== null);

    const userDetails = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true },
    });

    const topUsers = userActivity.map((ua) => {
      const user = userDetails.find((u) => u.id === ua.userId);
      return {
        name: user?.name || user?.email?.split("@")[0] || "Unknown",
        value: ua._count._all,
      };
    });

    return NextResponse.json({
      usageTrend: usageData,
      errorDistribution,
      engagementData,
      topUsers,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
