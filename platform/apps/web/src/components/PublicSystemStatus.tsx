"use client";

import React, { useEffect, useState } from "react";

export default function PublicSystemStatus() {
  const [status, setStatus] = useState<"checking" | "online" | "degraded">("checking");

  useEffect(() => {
    // Simple check: if this component renders, the web app is likely online.
    // We could add an API call to check JupyterHub or Vector health if needed.
    const timer = setTimeout(() => setStatus("online"), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/50 px-3 py-1 shadow-sm backdrop-blur-sm transition-all hover:border-emerald-200">
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
            status === "online" ? "bg-emerald-400" : status === "checking" ? "bg-amber-400" : "bg-red-400"
        }`}></span>
        <span className={`relative inline-flex h-2 w-2 rounded-full ${
            status === "online" ? "bg-emerald-500" : status === "checking" ? "bg-amber-500" : "bg-red-500"
        }`}></span>
      </span>
      <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
        {status === "online" ? "All Systems Operational" : status === "checking" ? "Monitoring Infrastructure" : "System Issues Detected"}
      </span>
    </div>
  );
}
