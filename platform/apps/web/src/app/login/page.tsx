"use client";

import { loginUser } from "@/actions/login";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BotShield from "@/components/BotShield";
import PublicSystemStatus from "@/components/PublicSystemStatus";

function getSafeCallbackUrl(callbackUrl: string | null) {
  if (callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")) {
    return callbackUrl;
  }

  return "/dashboard";
}

function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const wasRegistered = searchParams.get("registered") === "true";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await loginUser(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(getSafeCallbackUrl(searchParams.get("callbackUrl")));
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      {/* Left Side: About & Branding */}
      <div className="relative flex flex-1 flex-col justify-center bg-indigo-900 px-8 py-16 text-white lg:px-24">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="relative z-10">
            <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md shadow-xl border border-white/20">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
                LearnLab <span className="text-indigo-400">Bridge</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-indigo-100/80 leading-relaxed">
                Empowering the next generation of AI and Data Science experts with isolated, high-performance workbench environments.
            </p>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 border border-indigo-400/30">
                        <span className="text-lg">🧪</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-indigo-50">Isolated Lab</h3>
                        <p className="text-xs text-indigo-200/60 mt-1">Docker-based JupyterLab instances for every student.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 border border-indigo-400/30">
                        <span className="text-lg">📊</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-indigo-50">Deep Insights</h3>
                        <p className="text-xs text-indigo-200/60 mt-1">Behavioral tracking to analyze learning progress.</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-16 flex items-center gap-4 border-t border-indigo-800 pt-8">
                <PublicSystemStatus />
                <div className="flex flex-col gap-1">
                    <Link href="/about" className="text-xs font-bold text-indigo-300 hover:text-white transition-colors uppercase tracking-widest">
                        Project Documentation →
                    </Link>
                    <span className="text-[10px] font-mono text-indigo-400 opacity-60">Version {process.env.NEXT_PUBLIC_APP_VERSION}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex w-full flex-col justify-center bg-white px-8 py-16 lg:w-[480px] lg:px-12 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.05)]">
        <div className="mx-auto w-full max-w-sm">
            <div className="mb-10 lg:hidden">
                <h1 className="text-2xl font-black text-slate-800">LearnLab Bridge</h1>
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Sign in</h2>
            <p className="mt-2 text-sm text-slate-500">Welcome back! Please enter your credentials.</p>

            {wasRegistered && (
                <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex gap-3 items-center animate-in fade-in slide-in-from-top-2 duration-500">
                    <span className="text-emerald-500 text-xl">✅</span>
                    <div>
                        <p className="text-xs font-bold text-emerald-800">Registration successful!</p>
                        <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">Please wait for an administrator to activate your account.</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
                <BotShield />
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                    <input
                        name="email"
                        type="email"
                        required
                        placeholder="your.name@mwit.ac.th"
                        className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
                        disabled={loading}
                    />
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Password</label>
                    </div>
                    <input
                        name="password"
                        type="password"
                        required
                        placeholder="••••••••"
                        className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
                        disabled={loading}
                    />
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex gap-3 items-center animate-shake duration-300">
                        <span className="text-red-500">⚠️</span>
                        <p className="text-xs font-bold text-red-700 leading-tight">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-4 px-4 rounded-xl shadow-lg shadow-indigo-100 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            AUTHENTICATING...
                        </div>
                    ) : "SIGN IN"}
                </button>
            </form>

            <div className="mt-10 text-center">
                <p className="text-xs font-medium text-slate-500">
                    New to LearnLab?{" "}
                    <Link href="/register" className="text-indigo-600 font-bold hover:underline underline-offset-4 decoration-indigo-200">
                        Create an account
                    </Link>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
