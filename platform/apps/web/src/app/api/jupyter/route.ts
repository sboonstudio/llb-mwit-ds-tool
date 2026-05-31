import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getJupyterHubBaseUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

function getWorkspaceName(user: { id?: string; email?: string | null }) {
  const rawName = user.email || user.id || "user";

  return rawName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function createLaunchToken(username: string, role: string) {
  const secret = process.env.JUPYTERHUB_SHARED_SECRET;

  if (!secret) {
    throw new Error("JUPYTERHUB_SHARED_SECRET is required");
  }

  const payload = Buffer.from(
    JSON.stringify({
      sub: username,
      role: role,
      exp: Math.floor(Date.now() / 1000) + 120,
    })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userRole = (session.user as { role?: string }).role || "GUEST";
  if (userRole === "GUEST") {
    return new NextResponse("Forbidden: Guests cannot launch JupyterLab", { status: 403 });
  }

  const workspaceName = getWorkspaceName({
    id: session.user.id,
    email: session.user.email,
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: `JupyterHub Launch: ${workspaceName}`,
    },
  });

  const hubBaseUrl = await getJupyterHubBaseUrl();
  const launchToken = createLaunchToken(workspaceName, (session.user as { role?: string }).role || "STUDENT");
  const launchUrl = new URL("/hub/llbridge-login", hubBaseUrl);
  launchUrl.searchParams.set("token", launchToken);

  return NextResponse.redirect(launchUrl);
}
