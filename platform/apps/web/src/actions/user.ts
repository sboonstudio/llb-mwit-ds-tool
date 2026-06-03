"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function verifyCurrentPassword(password: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true }
  });

  if (!user || !user.password) return { error: "User not found" };

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return { error: "Incorrect password" };

  return { success: true };
}

export async function updateMyPassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const oldPassword = formData.get("oldPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (newPassword !== confirmPassword) return { error: "Passwords do not match" };
  if (newPassword.length < 6) return { error: "Password too short" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true }
  });

  if (!user || !user.password) return { error: "User not found" };

  const isValid = await bcrypt.compare(oldPassword, user.password);
  if (!isValid) return { error: "Current password is incorrect" };

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword }
  });

  return { success: true };
}

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
  
  // 1. Validation Rules
  if (!trimmedName || trimmedName.length < 2) {
    return { error: "Name must be at least 2 characters long." };
  }
  
  if (trimmedName.length > 50) {
    return { error: "Name is too long (max 50 characters)." };
  }

  // Security: Allow only alphanumeric, Thai characters, and spaces (No scripts or special symbols)
  const nameRegex = /^[a-zA-Z0-9 \u0E00-\u0E7F]+$/;
  if (!nameRegex.test(trimmedName)) {
    return { error: "Name contains invalid characters. Use letters, numbers, and spaces only." };
  }

  if (trimmedName === user.name) {
    return { success: true };
  }

  try {
    // 2. Case-insensitive Uniqueness Check
    const existingUser = await prisma.user.findFirst({
      where: { 
        name: {
          equals: trimmedName,
        },
        id: { not: session.user.id }
      }
    });

    if (existingUser) {
      return { error: "This name is already used by another member. Please choose a unique name." };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: trimmedName }
    });

    // 3. Force cache invalidation for all related pages
    revalidatePath("/dashboard");
    revalidatePath("/admin");
    
    return { success: true, newName: trimmedName };
  } catch (error: any) {
    return { error: "Failed to update name: " + error.message };
  }
}
