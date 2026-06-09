import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const latestUsage = await prisma.resourceUsage.findFirst({
      where: { userId: session.user.id },
      orderBy: { recordedAt: "desc" },
    });

    return NextResponse.json({
      cpuUsage: latestUsage?.cpuUsage || 0,
      memoryUsage: latestUsage?.memoryUsage || 0,
      recordedAt: latestUsage?.recordedAt || null,
    });
  } catch (error: any) {
    console.error("User Metrics API Error:", error.message);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
