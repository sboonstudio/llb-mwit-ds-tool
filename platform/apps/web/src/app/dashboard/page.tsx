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
    take: 10,
  });

  const isPublic = !host.includes("localhost") && !host.includes("127.0.0.1");

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <main className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-slate-500">LearnLab Bridge</p>
            <h1 className="text-3xl font-semibold">Lab Workspace</h1>
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

        {isPublic && (
          <div className="mb-8 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                🌐
              </span>
              <div>
                <h3 className="text-sm font-semibold text-indigo-900">
                  Public Access Enabled
                </h3>
                <p className="text-sm text-indigo-700">
                  Your lab is accessible at:{" "}
                  <a
                    href={currentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline decoration-indigo-300 underline-offset-2 hover:text-indigo-900"
                  >
                    {currentUrl}
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

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
            <h2 className="mb-2 text-xl font-semibold text-emerald-900">
              Usage Summary
            </h2>
            <p className="text-4xl font-semibold text-emerald-800">
              {logs.length}
            </p>
            <p className="mt-2 text-sm text-emerald-700">
              Lab access records shown below
            </p>
          </section>
        </div>

        <div className="mb-8">
          <ChangePasswordForm />
        </div>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="text-lg font-medium">Recent Activity</h3>
          </div>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                      {log.action}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={2}
                    className="px-6 py-4 text-center text-sm text-slate-500"
                  >
                    No activity found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
