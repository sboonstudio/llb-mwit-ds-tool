import { auth } from "@/auth";
import Link from "next/link";
import { getProjectVersion } from "@/lib/version";

export default async function AboutPage() {
  const version = getProjectVersion();

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <main className="mx-auto max-w-4xl">
        <div className="mb-12 flex flex-col items-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-2xl shadow-indigo-200">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">LearnLab Bridge</h1>
            <p className="mt-2 text-lg font-medium text-slate-500">The ultimate workbench for data science and AI education.</p>
            <div className="mt-4 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Version {version}</span>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="mb-4 text-xl font-bold text-slate-800">Our Mission</h2>
                <p className="text-sm leading-relaxed text-slate-600">
                    LearnLab Bridge is designed to bridge the gap between complex infrastructure and accessible learning. 
                    We provide isolated, secure, and resource-managed JupyterLab environments for students and professionals to experiment, learn, and grow.
                </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="mb-4 text-xl font-bold text-slate-800">Key Features</h2>
                <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex gap-2">
                        <span className="text-indigo-500 font-bold">✓</span>
                        <span>Isolated Docker-based JupyterLab instances.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-indigo-500 font-bold">✓</span>
                        <span>Learning Progress Intelligence and behavioral tracking.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-indigo-500 font-bold">✓</span>
                        <span>Real-time resource monitoring and quota management.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-indigo-500 font-bold">✓</span>
                        <span>Public access via secure Cloudflare Tunnels.</span>
                    </li>
                </ul>
            </section>
        </div>

        <div className="mt-12 rounded-2xl bg-indigo-900 p-8 text-white shadow-2xl shadow-indigo-200">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                <div>
                    <h3 className="text-xl font-bold">Ready to start learning?</h3>
                    <p className="mt-1 text-sm text-indigo-200">Head back to your dashboard and launch your workbench.</p>
                </div>
                <Link 
                    href="/dashboard"
                    className="inline-flex h-12 items-center rounded-xl bg-white px-8 text-sm font-bold text-indigo-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                    Back to Dashboard
                </Link>
            </div>
        </div>

        <footer className="mt-16 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
            &copy; 2026 MWIT DS - LearnLab Bridge Project. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
