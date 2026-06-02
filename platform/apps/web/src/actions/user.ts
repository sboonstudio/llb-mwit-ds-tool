"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateUserName(newName: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  // Check if role is STUDENT or higher
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, name: true }
  });

  if (!user || (user.role === "GUEST" && session.user.role !== "ADMIN")) {
    return { error: "You don't have permission to change your name yet." };
  }

  const trimmedName = newName.trim();
  if (!trimmedName || trimmedName.length < 2) {
    return { error: "Name must be at least 2 characters long." };
  }

  if (trimmedName === user.name) {
    return { success: true };
  }

  try {
    // Check for uniqueness
    const existingUser = await prisma.user.findFirst({
      where: { 
        name: {
          equals: trimmedName,
          // Case insensitive comparison for SQLite might need different approach or rely on DB config
          // but for now we'll do a standard check.
        },
        id: { not: session.user.id }
      }
    });

    if (existingUser) {
      return { error: "This name is already taken. Please choose another one." };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: trimmedName }
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { error: "Failed to update name: " + error.message };
  }
}
