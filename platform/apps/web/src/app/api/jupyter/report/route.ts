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
    
    // Handle both direct reports and Vector logs (syslog format)
    const records = Array.isArray(data) ? data : [data];
    
    for (const record of records) {
      // Vector syslog format usually has a 'message' field
      let type = record.type;
      let username = record.username;
      let action = record.action;
      let details = record.details;
      let metrics = record.metrics;
      let ipAddress = record.ipAddress;
      let timestamp = record.timestamp || record.recordedAt;

      // If it's from Vector (Syslog), extract from message
      if (record.message && typeof record.message === "string") {
        try {
          const inner = JSON.parse(record.message);
          if (inner.event) {
            type = "ACTIVITY";
            action = inner.event;
            details = inner;
            // Use hostname as a hint for username if not present
            // In our system, hostname is 'llbridge-lab-{username}'
            if (!username && record.host) {
               username = record.host.replace("llbridge-lab-", "");
            }
          }
        } catch (e) {
          // Not JSON, skip or log as raw
          continue;
        }
      }

      if (!username) continue;

      // Find internal User by username
      const allUsers = await prisma.user.findMany();
      const targetUser = allUsers.find(u => {
          const wsName = (u.email || u.id)
              .toLowerCase()
              .replace(/[^a-z0-9._-]+/g, "-")
              .replace(/^-+|-+$/g, "")
              .slice(0, 80);
          return wsName === username;
      });

      if (!targetUser) continue;

      if (type === "ACTIVITY") {
        await prisma.activityLog.create({
          data: {
            userId: targetUser.id,
            action: action || "UNKNOWN_ACTION",
            details: details ? JSON.stringify(details) : null,
            ipAddress: ipAddress,
            timestamp: timestamp ? new Date(timestamp) : undefined,
          },
        });
      } else if (type === "METRICS" && metrics) {
        await prisma.resourceUsage.create({
          data: {
            userId: targetUser.id,
            cpuUsage: parseFloat(metrics.cpu || 0),
            memoryUsage: parseFloat(metrics.memory || 0),
            recordedAt: timestamp ? new Date(timestamp) : undefined,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Report API Error:", error.message);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
