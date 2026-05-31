import { auth } from "@/auth";
import { getPublicUrl } from "@/lib/public-url";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (session?.user?.id) {
    return NextResponse.redirect(getPublicUrl("/api/jupyter", request));
  }

  const loginUrl = getPublicUrl("/login", request);
  loginUrl.searchParams.set("callbackUrl", "/api/jupyter");

  return NextResponse.redirect(loginUrl);
}
