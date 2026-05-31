import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import UserTable from "@/components/UserTable";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN" || !session?.user?.id) {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { activityLogs: true },
      },
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <main className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6">
          <div>
            <p className="text-sm font-medium text-slate-500">LearnLab Bridge Control</p>
            <h1 className="text-3xl font-semibold">User Management</h1>
          </div>
          <a
            href="/dashboard"
            className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Back to Dashboard
          </a>
        </div>

        <UserTable initialUsers={users} currentUserId={session.user.id} />
      </main>
    </div>
  );
}
