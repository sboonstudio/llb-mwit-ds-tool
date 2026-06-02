import { signOutUser } from "@/actions/auth";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import ActivityIntelligence from "@/components/ActivityIntelligence";
import EditNameForm from "@/components/EditNameForm";
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
  const canEditName = session.user.role !== "GUEST" || session.user.role === "ADMIN";

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
              <EditNameForm initialName={session.user.name || session.user.email || ""} canEdit={canEditName} />
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

        {/* Lab Management Hub */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </span>
              <h2 className="text-sm font-bold uppercase tracking-tight text-slate-800">Lab Management Hub</h2>
            </div>
            <div className="flex items-center gap-4">
               <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  SYSTEM READY
               </span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Primary Action: Launch Lab */}
              <div className="lg:col-span-2">
                <div className={`h-full rounded-xl border p-6 transition-all ${
                  session.user.role === "GUEST" ? "border-slate-100 bg-slate-50/50" : "border-blue-100 bg-blue-50/50 hover:border-blue-200"
                }`}>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className={`text-lg font-bold ${session.user.role === "GUEST" ? "text-slate-700" : "text-blue-900"}`}>
                      Workbench Launch
                    </h3>
                    <span className="text-[10px] font-mono text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded">
                      ID: {session.user.id.slice(0, 8)}
                    </span>
                  </div>
                  <p className={`mb-6 text-sm leading-relaxed ${session.user.role === "GUEST" ? "text-slate-500" : "text-blue-700/80"}`}>
                    {session.user.role === "GUEST" 
                      ? "Your account is currently in 'Guest' mode. Please contact an admin for workspace activation."
                      : "Start your private JupyterLab session. All your files and notebooks will be automatically preserved across sessions."
                    }
                  </p>
                  {session.user.role === "GUEST" ? (
                    <button disabled className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-lg bg-slate-300 px-6 text-sm font-bold text-white">
                      Awaiting Activation
                    </button>
                  ) : (
                    <a
                      href="/api/jupyter"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-blue-300"
                    >
                      🚀 Open Your Lab
                    </a>
                  )}
                </div>
              </div>

              {/* Status Section: Resource Usage */}
              <div className="space-y-4">
                <div className="h-full rounded-xl border border-emerald-100 bg-emerald-50/30 p-6">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-emerald-700">
                    Live Status
                  </h3>
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
                    <div className="flex items-center justify-between rounded-lg bg-white/50 p-3 border border-emerald-100/50">
                      <span className="text-[10px] font-bold text-emerald-600">CPU LOAD</span>
                      <span className="text-lg font-black text-emerald-900">{latestUsage ? `${latestUsage.cpuUsage.toFixed(1)}%` : "0.0%"}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white/50 p-3 border border-emerald-100/50">
                      <span className="text-[10px] font-bold text-emerald-600">RAM USAGE</span>
                      <span className="text-lg font-black text-emerald-900">{latestUsage ? `${latestUsage.memoryUsage.toFixed(0)} MB` : "0 MB"}</span>
                    </div>
                  </div>
                  <p className="mt-4 text-[9px] text-emerald-600/70 italic">
                    * Metrics captured from last session.
                  </p>
                </div>
              </div>
            </div>

            {/* Nested Configuration: Security & Password */}
            <div className="mt-6 border-t border-slate-100 pt-6">
              <details className="group">
                <summary className="flex cursor-pointer items-center justify-between list-none">
                  <div className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors">
                    <span className="text-sm">🛡️</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Account & Security Settings</span>
                  </div>
                  <div className="h-6 w-6 rounded-full border border-slate-200 flex items-center justify-center group-open:rotate-180 transition-transform shadow-sm">
                    <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </summary>
                <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 rounded-lg border border-slate-100 bg-slate-50/50 p-6">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Profile Management</h4>
                        <div className="rounded-md border border-slate-200 bg-white p-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Display Name</p>
                            <EditNameForm initialName={session.user.name || session.user.email || ""} canEdit={canEditName} />
                            <p className="mt-2 text-[9px] text-slate-400 leading-tight">
                                * Name must be unique and at least 2 characters. Only STUDENT roles and above can change their name.
                            </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Password Recovery</h4>
                        <div className="rounded-md border border-slate-200 bg-white p-4">
                            <ChangePasswordForm />
                        </div>
                      </div>
                   </div>
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* Learning Progress Intelligence Center */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </span>
              <h2 className="text-sm font-bold uppercase tracking-tight text-slate-800">Learning Progress Intelligence</h2>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">BEHAVIORAL INSIGHTS</span>
          </div>

          <div className="p-6">
            {/* Top KPI Metrics Row */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="group rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-md hover:border-indigo-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Code Runs</p>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-800">{stats.totalExecutions}</span>
                        <span className="text-[10px] text-slate-400 font-medium">executions</span>
                    </div>
                </div>
                <div className="group rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-md hover:border-emerald-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Success Rate</p>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-3xl font-black text-emerald-600">{stats.successRate}%</span>
                        <span className="text-[10px] text-emerald-400 font-medium">accuracy</span>
                    </div>
                </div>
                <div className="group rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-md hover:border-blue-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Most Used File</p>
                    <div className="mt-1">
                        <p className="truncate text-lg font-bold text-slate-800" title={stats.mostActiveFile}>{stats.mostActiveFile}</p>
                        <p className="text-[10px] text-blue-400 font-medium">active workspace</p>
                    </div>
                </div>
            </div>

            {/* Detailed Activity Insights with Search & Filter */}
            <ActivityIntelligence initialLogs={logs} />
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
