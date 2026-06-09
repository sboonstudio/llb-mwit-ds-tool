"use client";

import { useEffect, useState } from "react";

interface Metrics {
  cpuUsage: number;
  memoryUsage: number;
  recordedAt: string | null;
}

export default function LiveStatus({ initialData }: { initialData: Metrics | null }) {
  const [metrics, setMetrics] = useState<Metrics | null>(initialData);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsSyncing(true);
      try {
        const res = await fetch("/api/user/metrics");
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      } finally {
        setIsSyncing(false);
      }
    };

    // Refresh every 10 seconds
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full rounded-xl border border-emerald-100 bg-emerald-50/30 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-700">
          Live Status
        </h3>
        <span className={`flex h-1.5 w-1.5 rounded-full bg-emerald-500 ${isSyncing ? "animate-ping" : "animate-pulse"}`}></span>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
        <div className="flex items-center justify-between rounded-lg bg-white/50 p-3 border border-emerald-100/50">
          <span className="text-[10px] font-bold text-emerald-600">CPU LOAD</span>
          <span className="text-lg font-black text-emerald-900">
            {metrics ? `${metrics.cpuUsage.toFixed(1)}%` : "0.0%"}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-white/50 p-3 border border-emerald-100/50">
          <span className="text-[10px] font-bold text-emerald-600">RAM USAGE</span>
          <span className="text-lg font-black text-emerald-900">
            {metrics ? `${metrics.memoryUsage.toFixed(0)} MB` : "0 MB"}
          </span>
        </div>
      </div>
      <p className="mt-4 text-[9px] text-emerald-600/70 italic">
        {metrics?.recordedAt 
          ? `* Metrics captured at ${new Date(metrics.recordedAt).toLocaleTimeString()}.`
          : "* Metrics captured from last session."}
      </p>
    </div>
  );
}
