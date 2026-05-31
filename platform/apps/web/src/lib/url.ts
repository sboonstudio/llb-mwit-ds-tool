import { headers } from "next/headers";

/**
 * Dynamically determines the base URL for JupyterHub based on the current request.
 * This allows the application to work seamlessly across localhost, Nginx proxy, and Cloudflare Tunnels.
 */
export async function getJupyterHubBaseUrl() {
  const headerList = await headers();
  const host = headerList.get("host") || "";
  const forwardedProto = headerList.get("x-forwarded-proto");
  
  // Case 1: Accessed via localhost or direct IP (Development/Local mode)
  // This supports localhost:3000, 127.0.0.1:3000, or LAN IP like 192.168.1.5:3000
  if (host.includes("localhost:") || host.includes("127.0.0.1:") || /^\d+\.\d+\.\d+\.\d+/.test(host)) {
    const hostname = host.split(":")[0];
    const hubPort = process.env.JUPYTERHUB_PORT || "8000";
    return `http://${hostname}:${hubPort}`;
  }

  // Case 2: Accessed via Nginx Proxy or Cloudflare Tunnel
  const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
