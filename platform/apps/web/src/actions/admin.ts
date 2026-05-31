"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateUserRole(userId: string, newRole: Role) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  revalidatePath("/admin");
}

export async function deleteUser(userId: string) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  // Prevent self-deletion
  if (session.user.id === userId) {
    throw new Error("Cannot delete yourself");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/admin");
}

export async function adminResetPassword(userId: string, newPassword: string) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  if (!newPassword || newPassword.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    revalidatePath("/admin");
    return { success: "Password reset successfully" };
  } catch (error) {
    console.error("Admin reset password error:", error);
    return { error: "Failed to reset password" };
  }
}
