import { signOut } from "@/auth";
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type LogoutTokenPayload = {
  exp?: unknown;
  purpose?: unknown;
  sub?: unknown;
};

function verifyLogoutToken(token: string | null) {
  const secret = process.env.JUPYTERHUB_SHARED_SECRET;

  if (!secret || !token) {
    return false;
  }

  const [payloadB64, signature, extra] = token.split(".");

  if (!payloadB64 || !signature || extra !== undefined) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");

  const expected = Buffer.from(expectedSignature);
  const actual = Buffer.from(signature);

  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    return false;
  }

  let payload: LogoutTokenPayload;

  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
  } catch {
    return false;
  }

  if (payload.purpose !== "logout") {
    return false;
  }

  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    return false;
  }

  return typeof payload.sub === "string" && payload.sub.length > 0;
}

export async function GET(request: NextRequest) {
  // If token is invalid, we still want to sign out to be safe, but we can't 
  // verify it came from our JupyterHub.
  const isValid = verifyLogoutToken(request.nextUrl.searchParams.get("token"));
  
  if (!isValid) {
    console.warn("Invalid or expired JupyterHub logout token received");
  }

  // Final step: Clear the NextAuth session and redirect to login.
  // Using signOut here will clear the cookies and perform the redirect.
  return await signOut({ redirectTo: "/login" });
}
