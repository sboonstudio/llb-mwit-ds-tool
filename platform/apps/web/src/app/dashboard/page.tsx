import { signOutUser } from "@/actions/auth";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const headerList = await headers();
  const host = headerList.get("host") || "";
  const protocol = headerList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const currentUrl = `${protocol}://${host}`;

  if (!session?.user?.id) {
    redirect("/login");
  }

  const logs = await prisma.activityLog.findMany({
    where: { userId: session.user.id },
    orderBy: { timestamp: "desc" },
    take: 20,
  });

  // Calculate quick stats for the user
  const stats = {
    totalExecutions: logs.filter(l => l.action === "CELL_EXECUTION").length,
    successRate: 0,
    mostActiveFile: "N/A"
  };

  const executions = logs.filter(l => l.action === "CELL_EXECUTION");
  if (executions.length > 0) {
    const successCount = executions.filter(l => {
        try {
            return JSON.parse(l.details || "{}").success !== false;
        } catch(e) { return true; }
    }).length;
    stats.successRate = Math.round((successCount / executions.length) * 100);
    
    const fileCounts: Record<string, number> = {};
    executions.forEach(l => {
        try {
            const path = JSON.parse(l.details || "{}").path || "unknown";
            fileCounts[path] = (fileCounts[path] || 0) + 1;
        } catch(e) {}
    });
    stats.mostActiveFile = Object.entries(fileCounts).sort((a, b) => b[1] - a[1])[0]?.[0].split('/').pop() || "N/A";
  }

  const latestUsage = await prisma.resourceUsage.findFirst({
    where: { userId: session.user.id },
    orderBy: { recordedAt: "desc" },
  });

  const isPublic = !host.includes("localhost") && !host.includes("127.0.0.1");

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <main className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-slate-500">LearnLab Bridge</p>
            <div className="flex items-center gap-3">
                <h1 className="text-3xl font-semibold">Lab Workspace</h1>
                
                {/* Compact Connectivity Status Icon */}
                <details className="group relative">
                    <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm hover:border-indigo-300 transition-all">
                        <span className={`flex h-2 w-2 rounded-full ${isPublic ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></span>
                        <span className="text-lg leading-none">{isPublic ? "🌐" : "🏠"}</span>
                        <div className="max-w-0 overflow-hidden whitespace-nowrap text-[10px] font-bold text-slate-500 transition-all duration-300 group-open:max-w-xs group-open:ml-1">
                            {isPublic ? "PUBLIC ACCESS" : "LOCAL MODE"}
                        </div>
                    </summary>
                    <div className="absolute left-0 top-full z-10 mt-2 w-64 rounded-xl border border-indigo-100 bg-white p-4 shadow-xl">
                        <p className="text-xs font-bold text-indigo-900 uppercase mb-2">Connectivity</p>
                        {isPublic ? (
                            <div className="space-y-2">
                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                    Your lab is exposed securely via Cloudflare Tunnel.
                                </p>
                                <a
                                    href={currentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block font-mono text-[10px] bg-slate-50 p-2 rounded border border-indigo-100 text-indigo-700 hover:bg-indigo-50 truncate"
                                >
                                    {currentUrl}
                                </a>
                            </div>
                        ) : (
                            <p className="text-[10px] text-slate-500 italic">
                                Currently operating in restricted local network mode.
                            </p>
                        )}
                    </div>
                </details>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${
                session.user.role === "ADMIN" ? "bg-red-100 text-red-700" :
                session.user.role === "COACH" ? "bg-purple-100 text-purple-700" :
                "bg-blue-100 text-blue-700"
              }`}>
                {session.user.role || "STUDENT"}
              </span>
              <span className="text-sm text-slate-600">
                {session.user.name || session.user.email}
              </span>
            </div>
            <div className="flex gap-2">
              {session.user.role === "ADMIN" && (
                <a
                  href="/admin"
                  className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Admin Panel
                </a>
              )}
              <form action={signOutUser}>
                <button
                  type="submit"
                  className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Account Security Section (Top-aligned) */}
        <section className="mb-8 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <details className="group">
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors list-none">
                    <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-sm">
                            🛡️
                        </span>
                        <div>
                            <h3 className="font-semibold text-slate-800 text-sm">Security & Password</h3>
                            <p className="text-[10px] text-slate-400">Manage your credentials and access safety</p>
                        </div>
                    </div>
                    <svg className="h-4 w-4 text-slate-300 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </summary>
                
                <div className="border-t border-slate-100 bg-slate-50/30 p-6">
                    <div className="max-w-md">
                        <ChangePasswordForm />
                    </div>
                </div>
            </details>
        </section>

        {/* Action & Metrics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <section className={`rounded-lg border p-6 ${
            session.user.role === "GUEST" ? "border-slate-200 bg-slate-50" : "border-blue-200 bg-blue-50"
          }`}>
            <h2 className={`mb-2 text-xl font-semibold ${
              session.user.role === "GUEST" ? "text-slate-900" : "text-blue-900"
            }`}>
              Launch JupyterLab
            </h2>
            <p className={`mb-5 text-sm leading-6 ${
              session.user.role === "GUEST" ? "text-slate-600" : "text-blue-700"
            }`}>
              {session.user.role === "GUEST" 
                ? "Your account is pending approval. Please wait for an administrator to grant you access before launching the lab."
                : "Open your isolated JupyterLab container. Your work folder is private, and shared course files are mounted read-only."
              }
            </p>
            {session.user.role === "GUEST" ? (
              <button
                disabled
                className="inline-flex h-11 cursor-not-allowed items-center rounded-md bg-slate-300 px-5 text-sm font-semibold text-white"
              >
                Access Locked
              </button>
            ) : (
              <a
                href="/api/jupyter"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center rounded-md bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Open JupyterLab
              </a>
            )}
          </section>

          <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
            <h2 className="mb-4 text-xl font-semibold text-emerald-900">
              Resource Usage
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-emerald-600 uppercase">Latest CPU</p>
                <p className="text-2xl font-bold text-emerald-800">
                  {latestUsage ? `${latestUsage.cpuUsage.toFixed(1)}%` : "0.0%"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-600 uppercase">Latest RAM</p>
                <p className="text-2xl font-bold text-emerald-800">
                  {latestUsage ? `${latestUsage.memoryUsage.toFixed(0)} MB` : "0 MB"}
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-emerald-600 italic">
              * Stats recorded at the end of your last session.
            </p>
          </section>
        </div>

        {/* Analytics Summary */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Code Runs</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalExecutions}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Success Rate</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.successRate}%</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Most Used File</p>
                <p className="truncate text-lg font-bold text-slate-800" title={stats.mostActiveFile}>{stats.mostActiveFile}</p>
            </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 px-6 py-4">
            <h3 className="font-semibold text-slate-800">Recent Activity Insights</h3>
            <span className="text-xs text-slate-500">Showing last 20 events</span>
          </div>
          
          <div className="divide-y divide-slate-100">
            {logs.length > 0 ? (
                logs.map((log) => (
                    <ActivityItem key={log.id} log={log} />
                ))
            ) : (
                <div className="py-12 text-center text-sm text-slate-400 italic">
                    No activity recorded yet. Start your lab to see insights!
                </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function ActivityItem({ log }: { log: any }) {
    let details: any = null;
    try {
        details = log.details ? JSON.parse(log.details) : null;
    } catch(e) {}

    const isError = details?.success === false;
    const isCode = log.action === "CELL_EXECUTION";
    const isShell = log.action === "SHELL_CMD";

    return (
        <details className="group">
            <summary className="flex cursor-pointer items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors list-none">
                <div className="flex items-center gap-4">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        isError ? "bg-red-100 text-red-600" : 
                        isCode ? "bg-blue-100 text-blue-600" :
                        isShell ? "bg-amber-100 text-amber-600" :
                        "bg-slate-100 text-slate-600"
                    }`}>
                        {isError ? "!" : isCode ? "PY" : isShell ? ">_" : "i"}
                    </span>
                    <div>
                        <p className={`text-sm font-medium ${isError ? "text-red-700" : "text-slate-700"}`}>
                            {log.action}
                            {details?.path && <span className="ml-2 text-xs font-normal text-slate-400">in {details.path.split('/').pop()}</span>}
                        </p>
                        <p className="text-[10px] text-slate-400">
                            {new Date(log.timestamp).toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {details?.error_type && (
                        <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-500 uppercase">
                            {details.error_type}
                        </span>
                    )}
                    <svg className="h-4 w-4 text-slate-300 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </summary>
            <div className="border-t border-slate-50 bg-slate-50/30 px-6 py-4 text-xs">
                {isCode && (
                    <div className="space-y-2">
                        <p className="font-bold text-slate-500 uppercase tracking-tighter">Executed Code:</p>
                        <pre className="overflow-x-auto rounded-md bg-slate-900 p-3 text-slate-300">
                            <code>{details?.code}</code>
                        </pre>
                    </div>
                )}
                {isShell && (
                    <div className="flex gap-2 items-center">
                        <span className="text-slate-400 font-mono">$</span>
                        <code className="text-slate-700 font-bold">{details?.cmd}</code>
                    </div>
                )}
                {isError && (
                    <div className="mt-2 rounded-md border border-red-100 bg-red-50/50 p-3 text-red-700">
                        <p className="font-bold">{details?.error_type}</p>
                        <p className="font-mono mt-1">{details?.error_msg}</p>
                    </div>
                )}
                {!isCode && !isShell && !isError && (
                    <p className="text-slate-500 italic">No additional details available.</p>
                )}
            </div>
        </details>
    );
}
