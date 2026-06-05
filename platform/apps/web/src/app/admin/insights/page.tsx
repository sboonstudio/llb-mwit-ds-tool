import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminInsights from "@/components/AdminInsights";
import TelemetryDebugStream from "@/components/TelemetryDebugStream";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const isCoach = session?.user?.role === "COACH";

  if (!isAdmin && !isCoach) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <main className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6">
          <div>
            <p className="text-sm font-medium text-slate-500">LearnLab Bridge Intelligence</p>
            <h1 className="text-3xl font-semibold">Learning Insights</h1>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
                <a
                    href="/admin"
                    className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                    Admin Panel
                </a>
            )}
            <a
                href="/dashboard"
                className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
                Back to Dashboard
            </a>
          </div>
        </div>

        <section className="mb-8">
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs font-bold uppercase text-blue-600">Total Activities</p>
                    <h4 className="text-2xl font-bold text-blue-900">Live Tracking</h4>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-xs font-bold uppercase text-emerald-600">Active Containers</p>
                    <h4 className="text-2xl font-bold text-emerald-900">Monitoring</h4>
                </div>
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                    <p className="text-xs font-bold uppercase text-amber-600">System Status</p>
                    <h4 className="text-2xl font-bold text-amber-900">Optimal</h4>
                </div>
            </div>

            <AdminInsights />
        </section>

        {isAdmin && (
            <section className="mt-12">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">Live Telemetry Debug</h2>
                    <span className="rounded bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600">REAL-TIME MONITOR</span>
                </div>
                <TelemetryDebugStream />
            </section>
        )}
      </main>
    </div>
  );
}
