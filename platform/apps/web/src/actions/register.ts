"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { validateBotShield } from "@/lib/security";

export async function registerUser(formData: FormData) {
  // Anti-bot check
  const shield = validateBotShield(formData);
  if (shield.isBot) {
    return { error: shield.reason };
  }

  const email = (formData.get("email") as string || "").trim().toLowerCase();
  const password = formData.get("password") as string;
  const name = (formData.get("name") as string || "").trim();

  // 1. Basic Presence Validation
  if (!email || !password || !name) {
    return { error: "Name, email, and password are required" };
  }

  // 2. Name Rules (Thai, English, Numbers, Spaces only, 2-50 chars)
  if (name.length < 2 || name.length > 50) {
    return { error: "Name must be between 2 and 50 characters" };
  }
  const nameRegex = /^[a-zA-Z0-9 \u0E00-\u0E7F]+$/;
  if (!nameRegex.test(name)) {
    return { error: "Name contains invalid characters. Use letters, numbers, and spaces only." };
  }

  // 3. Email Format Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Please enter a valid email address" };
  }

  // 4. Password Strength (Server-side check)
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  try {
    // 2. Rate Limiting Check (Max 3 registration attempts in last 10 minutes per IP/system)
    // Since we don't have easy access to IP here without headers(), 
    // we'll at least limit global registration velocity for now or use name/email patterns.
    const recentRegistrations = await prisma.activityLog.count({
        where: {
            action: "REGISTER_ATTEMPT",
            timestamp: { gte: new Date(Date.now() - 10 * 60 * 1000) }
        }
    });

    if (recentRegistrations >= 10) {
        return { error: "System is busy. Please try again in 10 minutes." };
    }

    // Log the attempt
    await prisma.activityLog.create({
        data: {
            userId: null,
            action: "REGISTER_ATTEMPT",
            details: JSON.stringify({ email })
        }
    }).catch(() => {});

    // 5. Uniqueness Checks
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return { error: "This email is already registered. Please login instead." };
    }

    const existingName = await prisma.user.findFirst({
        where: { name: { equals: name } }
    });
    if (existingName) {
        return { error: "This name is already taken. Please choose a unique display name." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "GUEST",
      },
    });
    return { success: "Account created successfully! Please wait for admin approval." };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { error: "Internal server error during registration." };
  }
}
