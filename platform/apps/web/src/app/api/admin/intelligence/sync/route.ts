import { syncIntelligence } from "@/lib/intelligence";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();

  // ป้องกันเฉพาะ Admin เท่านั้นที่รันได้
  if (session?.user?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await syncIntelligence();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Intelligence Sync Error:", error.message);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
