"use client";

import { loginUser } from "@/actions/login";
import Link from "next/link";
import { Suspense, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BotShield from "@/components/BotShield";

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4">
      <div className="p-8 bg-white shadow-xl rounded-2xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h12m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Welcome Back</h1>
            <p className="text-sm text-slate-500 mt-1">Access your LearnLab workbench sessions.</p>
        </div>

        {wasRegistered && (
            <div className="mb-6 p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex gap-3 items-center">
                <span className="text-emerald-500 text-lg">✅</span>
                <p className="text-xs font-bold text-emerald-700 leading-tight">Registration successful! You can login once an admin approves your account.</p>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <BotShield />
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
            <input
              name="email"
              type="email"
              required
              placeholder="name@mwit.ac.th"
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Password</label>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex gap-3 items-center">
                <span className="text-red-500 text-lg">⚠️</span>
                <p className="text-xs font-bold text-red-700 leading-tight">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 rounded-xl shadow-lg shadow-indigo-100 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? "AUTHENTICATING..." : "SIGN IN"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs font-medium text-slate-500">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-indigo-600 font-bold hover:underline underline-offset-4 decoration-indigo-200">
                    Register here
                </Link>
            </p>
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
