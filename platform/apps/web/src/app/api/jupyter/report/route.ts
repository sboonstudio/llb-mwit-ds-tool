import prisma from "@/lib/prisma";
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const secret = process.env.JUPYTERHUB_SHARED_SECRET;
  const authHeader = req.headers.get("Authorization");

  if (!secret) {
      return new NextResponse("Server Configuration Error", { status: 500 });
  }

  // Simple Token check or HMAC
  if (authHeader !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const data = await req.json();
    const { type, username, action, details, metrics, ipAddress } = data;

    // Find internal User by username (which is the workspace name)
    // In our system, workspaceName is usually the email with @ replaced by -
    const allUsers = await prisma.user.findMany();
    const targetUser = allUsers.find(u => {
        const wsName = (u.email || u.id)
            .toLowerCase()
            .replace(/[^a-z0-9._-]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 80);
        return wsName === username;
    });

    if (!targetUser) {
        return new NextResponse("User not found", { status: 404 });
    }

    if (type === "ACTIVITY") {
      await prisma.activityLog.create({
        data: {
          userId: targetUser.id,
          action: action,
          details: details ? JSON.stringify(details) : null,
          ipAddress: ipAddress,
        },
      });
    } else if (type === "METRICS") {
      await prisma.resourceUsage.create({
        data: {
          userId: targetUser.id,
          cpuUsage: parseFloat(metrics.cpu || 0),
          memoryUsage: parseFloat(metrics.memory || 0),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Report API Error:", error.message);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
