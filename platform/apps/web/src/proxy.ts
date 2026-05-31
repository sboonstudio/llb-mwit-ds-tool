import { auth } from "@/auth";
import { NextResponse } from "next/server";

function getSafeCallbackPath(callbackUrl: string | null) {
  if (callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")) {
    return callbackUrl;
  }

  return "/dashboard";
}

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register");
  const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard");

  if (isDashboardPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isAuthPage && isLoggedIn) {
    const callbackPath = getSafeCallbackPath(req.nextUrl.searchParams.get("callbackUrl"));

    return NextResponse.redirect(new URL(callbackPath, req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
