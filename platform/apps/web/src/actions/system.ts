"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getSystemConfig() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  try {
    let config = await prisma.systemConfig.findUnique({
      where: { id: "CURRENT" }
    });

    if (!config) {
      config = await prisma.systemConfig.create({
        data: { id: "CURRENT" }
      });
    }

    return config;
  } catch (error) {
    console.error("Failed to get system config:", error);
    // Return a default config object instead of crashing if table is missing or DB is locked
    return {
      id: "CURRENT",
      retentionDays: 30,
      autoRotate: true,
      errorThreshold: 10,
      alertWindowMins: 60,
      notifyEmail: null,
      enableAlerts: false,
      updatedAt: new Date()
    };
  }
}

export async function updateSystemConfig(data: {
  retentionDays?: number;
  autoRotate?: boolean;
  errorThreshold?: number;
  alertWindowMins?: number;
  notifyEmail?: string | null;
  enableAlerts?: boolean;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const config = await prisma.systemConfig.upsert({
    where: { id: "CURRENT" },
    update: data,
    create: { id: "CURRENT", ...data }
  });

  revalidatePath("/admin/settings");
  return { success: true, config };
}

/**
 * Manually trigger log rotation based on current config
 */
export async function performLogRotation() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const config = await getSystemConfig();
  const cutOffDate = new Date();
  cutOffDate.setDate(cutOffDate.getDate() - config.retentionDays);

  const deleted = await prisma.activityLog.deleteMany({
    where: {
      timestamp: { lt: cutOffDate }
    }
  });

  // Log the rotation itself
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "LOG_ROTATION",
      details: JSON.stringify({
        deletedCount: deleted.count,
        retentionDays: config.retentionDays,
        cutOffDate: cutOffDate.toISOString()
      })
    }
  });

  revalidatePath("/admin");
  return { success: true, deletedCount: deleted.count };
}

/**
 * Check for abnormal error rates in user activities
 */
export async function checkSystemAlerts() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const config = await getSystemConfig();
  if (!config.enableAlerts) return { enabled: false };

  const windowStart = new Date(Date.now() - config.alertWindowMins * 60 * 1000);

  // Count errors in the window (where success is false in details or other indicators)
  // Our ipython_logger sends "success": false for CELL_EXECUTION errors
  const logs = await prisma.activityLog.findMany({
    where: {
      timestamp: { gte: windowStart },
      action: "CELL_EXECUTION"
    }
  });

  const errorLogs = logs.filter(log => {
    try {
      const details = JSON.parse(log.details || "{}");
      return details.success === false;
    } catch {
      return false;
    }
  });

  if (errorLogs.length >= config.errorThreshold) {
    return {
      alert: true,
      count: errorLogs.length,
      threshold: config.errorThreshold,
      message: `System Alert: High error frequency detected (${errorLogs.length} errors in last ${config.alertWindowMins} mins)`
    };
  }

  return { alert: false, count: errorLogs.length };
}
