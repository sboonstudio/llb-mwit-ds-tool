import { NextRequest } from "next/server";

export function getPublicBaseUrl(request?: NextRequest) {
  // 1. Try to get the host from headers (more reliable in Proxy/Docker)
  const hostHeader = request?.headers.get("host");
  const xForwardedHost = request?.headers.get("x-forwarded-host");
  const host = xForwardedHost || hostHeader;
  
  // 2. Determine protocol
  const xForwardedProto = request?.headers.get("x-forwarded-proto");
  const protocol = xForwardedProto || (host?.includes("localhost") ? "http" : "https");

  // 3. Check if the detected host is "valid" (not an internal Docker name)
  // Internal names like 'llbridge-web' or hex container IDs should be ignored
  const isInternal = host && (
    host.includes("llbridge-") || 
    /^[a-f0-9]{12}(:\d+)?$/.test(host) || 
    host.startsWith("172.") || 
    host.startsWith("10.")
  );

  if (host && !isInternal) {
    return `${protocol}://${host}`.replace(/\/+$/, "");
  }

  // 4. Fallback to configured environment variables
  const configuredUrl =
    process.env.AUTH_URL ||
    process.env.LLBRIDGE_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  // 5. Final fallback
  return "http://localhost:3000";
}

export function getPublicUrl(path: string, request?: NextRequest) {
  const baseUrl = getPublicBaseUrl(request);
  return new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
}
