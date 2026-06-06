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
      let type = record.type;
      let username = record.username || record.user;
      let action = record.action || record.event;
      let details = record.details;
      let metrics = record.metrics;
      let ipAddress = record.ipAddress || record.host;
      let timestamp = record.timestamp || record.recordedAt || record.processed_at;

      // If it's from Vector (Syslog), and not yet fully parsed or missing fields
      if (record.message && typeof record.message === "string" && !action) {
        try {
          // Extract JSON part from Syslog message if possible
          const jsonMatch = record.message.match(/\{.*\}/);
          if (jsonMatch) {
            const inner = JSON.parse(jsonMatch[0]);
            if (inner.event) {
              type = "ACTIVITY";
              action = inner.event;
              details = inner;
              if (!username) username = inner.user;
            }
          }
        } catch (e) {
          // Not JSON, skip
        }
      }

      // If action exists but details is empty, use the record itself as details (excluding large fields)
      if (action && !details) {
          const { message, ...rest } = record;
          details = rest;
      }

      // Default type if action exists
      if (action && !type) {
        type = "ACTIVITY";
      }

      if (!username) continue;

      // Find internal User by username
      const allUsers = await prisma.user.findMany();
      const targetUser = allUsers.find(u => {
          const email = (u.email || "").toLowerCase();
          const wsName = email
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
            ipAddress: String(ipAddress || ""),
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
