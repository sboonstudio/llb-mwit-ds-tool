import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Get the very latest 20 logs to simulate a real-time stream
    const logs = await prisma.activityLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 20,
      include: {
        user: {
          select: { email: true }
        }
      }
    });

    const streamData = logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      action: log.action,
      userEmail: log.user?.email || "System",
      details: log.details ? JSON.parse(log.details) : null
    }));

    return NextResponse.json(streamData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
