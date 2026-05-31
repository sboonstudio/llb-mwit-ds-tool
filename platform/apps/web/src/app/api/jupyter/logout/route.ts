import { NextResponse } from "next/server";
import { getJupyterHubBaseUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export async function GET() {
  const hubBaseUrl = await getJupyterHubBaseUrl();
  // We use the custom llbridge-logout path to ensure we hit our custom 
  // handler in LLBridgeAuthenticator and avoid standard route conflicts.
  const logoutUrl = new URL("/hub/llbridge-logout", hubBaseUrl).toString();
  
  return NextResponse.redirect(logoutUrl);
}
