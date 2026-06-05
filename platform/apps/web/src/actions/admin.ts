"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateUserRole(userId: string, newRole: Role) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN" || !session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Safeguard: Check if this is the last admin being demoted
  if (newRole !== "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      const targetUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true }
      });
      
      if (adminCount <= 1 && targetUser?.role === "ADMIN") {
          throw new Error("Operation failed: You cannot demote the last administrator. The system must have at least one ADMIN.");
      }
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true }
  });

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  // Audit Log
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "ADMIN_UPDATE_ROLE",
      details: JSON.stringify({
        targetUserId: userId,
        targetEmail: targetUser?.email,
        oldRole: targetUser?.role,
        newRole: newRole
      })
    }
  });

  revalidatePath("/admin");
}

export async function deleteUser(userId: string) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN" || !session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Prevent self-deletion
  if (session.user.id === userId) {
    throw new Error("Cannot delete yourself");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true }
  });

  // Safeguard: Check if this is the last admin being deleted
  if (targetUser?.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
          throw new Error("Operation failed: You cannot delete the last administrator. The system must have at least one ADMIN.");
      }
  }

  // Audit Log BEFORE deletion
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "ADMIN_DELETE_USER",
      details: JSON.stringify({
        targetUserId: userId,
        targetEmail: targetUser?.email
      })
    }
  });

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/admin");
}

export async function adminResetPassword(userId: string, newPassword: string) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN" || !session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (!newPassword || newPassword.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  try {
    const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
    });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Audit Log
    await prisma.activityLog.create({
        data: {
            userId: session.user.id,
            action: "ADMIN_RESET_PASSWORD",
            details: JSON.stringify({
                targetUserId: userId,
                targetEmail: targetUser?.email
            })
        }
    });

    revalidatePath("/admin");
    return { success: true, message: "Password reset successfully" };
  } catch (error) {
    console.error("Admin reset password error:", error);
    return { error: "Failed to reset password" };
  }
}
