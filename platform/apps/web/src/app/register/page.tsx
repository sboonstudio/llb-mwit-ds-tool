"use client";

import { registerUser } from "@/actions/register";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import PasswordIntelligence from "@/components/PasswordIntelligence";
import BotShield from "@/components/BotShield";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // Real-time Name Validation
  const nameError = useMemo(() => {
    if (!name) return null;
    if (name.length < 2) return "Name too short";
    const nameRegex = /^[a-zA-Z0-9 \u0E00-\u0E7F]+$/;
    if (!nameRegex.test(name)) return "Invalid characters used";
    return null;
  }, [name]);

  // Real-time Email Validation
  const emailError = useMemo(() => {
    if (!email) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Invalid email format";
    return null;
  }, [email]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (nameError || emailError) return;
    
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await registerUser(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/login?registered=true");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4">
      <div className="p-8 bg-white shadow-xl rounded-2xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
            <p className="text-sm text-slate-500 mt-1 text-balance">Join LearnLab Bridge to start your interactive workbench.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <BotShield />
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Display Name</label>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Boonnatee Sak"
              className={`block w-full px-4 py-2.5 bg-slate-50 border ${nameError ? 'border-red-300' : 'border-slate-200'} rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-4 ${nameError ? 'focus:ring-red-50' : 'focus:ring-indigo-50'} transition-all`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            {nameError && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{nameError}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
            <input
              name="email"
              type="email"
              required
              placeholder="name@mwit.ac.th"
              className={`block w-full px-4 py-2.5 bg-slate-50 border ${emailError ? 'border-red-300' : 'border-slate-200'} rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-4 ${emailError ? 'focus:ring-red-50' : 'focus:ring-indigo-50'} transition-all`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            {emailError && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{emailError}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Secure Password</label>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <PasswordIntelligence password={password} />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex gap-3 items-center">
                <span className="text-red-500 text-lg">⚠️</span>
                <p className="text-xs font-bold text-red-700 leading-tight">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !!nameError || !!emailError}
            className="w-full flex justify-center py-3 px-4 rounded-xl shadow-lg shadow-indigo-100 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? "CREATING ACCOUNT..." : "REGISTER"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs font-medium text-slate-500">
                Already have an account?{" "}
                <Link href="/login" className="text-indigo-600 font-bold hover:underline underline-offset-4 decoration-indigo-200">
                    Sign in here
                </Link>
            </p>
        </div>
      </div>
    </div>
  );
}
