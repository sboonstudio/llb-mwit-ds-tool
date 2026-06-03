"use server";

import { signIn } from "@/auth";
import { validateBotShield } from "@/lib/security";
import { AuthError } from "next-auth";
import prisma from "@/lib/prisma";

export async function loginUser(formData: FormData) {
  // 1. Anti-bot check
  const shield = validateBotShield(formData);
  if (shield.isBot) {
    return { error: shield.reason };
  }

  const email = (formData.get("email") as string || "").trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    // 2. Rate Limiting Check (Simple: Max 5 failures in last 5 minutes per email)
    const recentFailures = await prisma.activityLog.count({
        where: {
            action: "LOGIN_FAILURE",
            details: { contains: email },
            timestamp: { gte: new Date(Date.now() - 5 * 60 * 1000) }
        }
    });

    if (recentFailures >= 5) {
        return { error: "Too many failed attempts. Please try again in 5 minutes." };
    }

    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    
    // Log Success (Optional as NextAuth might handle session)
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      // Log Failure for rate limiting
      await prisma.activityLog.create({
          data: {
              userId: null,
              action: "LOGIN_FAILURE",
              details: JSON.stringify({ email, type: error.type })
          }
      }).catch(() => {});

      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password" };
        default:
          return { error: "Something went wrong during login" };
      }
    }
    throw error;
  }
}
