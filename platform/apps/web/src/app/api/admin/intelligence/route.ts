import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const isCoach = session?.user?.role === "COACH";

  if (!isAdmin && !isCoach) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // 1. TOPICS: สรุปข้อมูลรายบทเรียน (Folder Name) และไฟล์ (Filename)
    const topicStats = await prisma.executionStats.findMany({
      select: {
        folderName: true,
        fileName: true,
        successCount: true,
        errorCount: true,
      },
      orderBy: [
        { folderName: "asc" },
        { fileName: "asc" },
      ],
    });

    // จัดกลุ่มตาม Folder และ Filename ในระดับ API
    const topics: any[] = [];
    topicStats.forEach(stat => {
        let topic = topics.find(t => t.name === stat.folderName);
        if (!topic) {
            topic = { name: stat.folderName, success: 0, error: 0, total: 0, files: [] };
            topics.push(topic);
        }
        topic.success += stat.successCount;
        topic.error += stat.errorCount;
        topic.total += (stat.successCount + stat.errorCount);
        topic.files.push({
            name: stat.fileName,
            success: stat.successCount,
            error: stat.errorCount,
        });
    });

    // 2. SYSTEM OPS: สรุปการจัดการระบบ (ENV_LIFECYCLE vs WORKSPACE)
    const systemOps = await prisma.systemOpsStats.groupBy({
      by: ["actionGroup", "actionType"],
      _sum: {
        count: true,
      },
    });

    const envLifecycle = systemOps
      .filter((op) => op.actionGroup === "ENV_LIFECYCLE")
      .map((op) => ({ name: op.actionType, value: op._sum.count || 0 }));

    const workspace = systemOps
      .filter((op) => op.actionGroup === "WORKSPACE")
      .map((op) => ({ name: op.actionType, value: op._sum.count || 0 }));

    // 3. LANGUAGE: สรุปตามนามสกุลไฟล์
    const languageStats = await prisma.executionStats.groupBy({
      by: ["fileExtension"],
      _sum: {
        successCount: true,
        errorCount: true,
      },
    });

    const languages = languageStats.map((l) => ({
      name: l.fileExtension,
      value: (l._sum.successCount || 0) + (l._sum.errorCount || 0),
    }));

    // 4. ERROR TREND: สรุป Error รายวัน
    const errorTrend = await prisma.errorAnalytics.findMany({
      orderBy: { date: "asc" },
      take: 15, // ดูย้อนหลัง 15 วันที่มีข้อมูล
    });

    // 5. GET LAST SYNC TIME
    const config = await prisma.systemConfig.findUnique({
      where: { id: "CURRENT" },
    });

    // 6. TOTAL ACTIVE MINUTES
    const dailyStats = await prisma.dailyUserStats.aggregate({
        _sum: {
          activeMinutes: true,
        },
    });

    return NextResponse.json({
      topics,
      envLifecycle,
      workspace,
      languages,
      errorTrend: errorTrend.map((e) => ({
        date: e.date.toISOString().split("T")[0],
        type: e.errorType,
        count: e.count,
      })),
      lastSyncedAt: config?.lastSyncedAt,
      totalActiveMinutes: dailyStats._sum.activeMinutes || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
