"use client";

import { useState, useEffect } from "react";

interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  userEmail: string;
  details: any;
}

export default function TelemetryDebugStream() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      interval = setInterval(async () => {
        try {
          const res = await fetch("/api/admin/debug-stream");
          const newLogs = await res.json();
          if (newLogs.length > 0) {
            setLogs(prev => {
              // Add only new logs by ID
              const existingIds = new Set(prev.map(l => l.id));
              const uniqueNewLogs = newLogs.filter((l: any) => !existingIds.has(l.id));
              return [...uniqueNewLogs, ...prev].slice(0, 50); // Keep last 50
            });
          }
        } catch (e) {
          console.error("Debug stream error:", e);
        }
      }, 3000); // Poll every 3 seconds
    }

    return () => clearInterval(interval);
  }, [isActive]);

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(filter.toLowerCase()) || 
    l.userEmail.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-900 p-6 shadow-xl text-slate-300 font-mono text-xs">
      <div className="mb-4 flex items-center justify-between border-b border-slate-700 pb-4">
        <div className="flex items-center gap-3">
          <div className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Telemetry Debug Stream</h3>
        </div>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Filter logs..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
          />
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`px-3 py-1 rounded font-bold uppercase transition-colors ${isActive ? "bg-red-900/50 text-red-400 hover:bg-red-900" : "bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900"}`}
          >
            {isActive ? "Stop Debug" : "Start Live Stream"}
          </button>
          <button 
            onClick={() => setLogs([])}
            className="text-slate-500 hover:text-white"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-600 italic">
            {isActive ? "Waiting for telemetry packets..." : "Stream paused. Click 'Start Live Stream' to begin monitoring."}
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="group border-l-2 border-indigo-500 bg-slate-800/50 p-2 hover:bg-slate-800 transition-colors">
              <div className="flex justify-between mb-1">
                <span className="text-indigo-400 font-bold">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span className="text-emerald-400 font-bold uppercase">{log.action}</span>
                <span className="text-amber-400">{log.userEmail}</span>
              </div>
              <div className="text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap group-hover:whitespace-normal group-hover:break-all">
                {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
