import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AuditLogViewer from "@/components/AuditLogViewer";

export const dynamic = "force-dynamic";

export default async function AuditLogPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN" || !session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <main className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6">
          <div>
            <p className="text-sm font-medium text-slate-500">LearnLab Bridge Control</p>
            <h1 className="text-3xl font-semibold">System Audit Logs</h1>
          </div>
          <div className="flex gap-3">
            <a
              href="/admin"
              className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              User Management
            </a>
            <a
              href="/admin/insights"
              className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Learning Insights
            </a>
            <a
              href="/dashboard"
              className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Back to Dashboard
            </a>
          </div>
        </div>

        <section>
          <AuditLogViewer />
        </section>
      </main>
    </div>
  );
}
