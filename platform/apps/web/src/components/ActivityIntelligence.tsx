"use client";

import React, { useState, useMemo } from "react";

type Log = {
  id: string;
  action: string;
  details: string | null;
  timestamp: Date | string;
};

export default function ActivityIntelligence({ initialLogs }: { initialLogs: any[] }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL"); // ALL, SUCCESS, ERROR
  const [filterType, setFilterType] = useState("ALL"); // ALL, CELL_EXECUTION, SHELL_CMD, OTHER
  
  // New State for Preferences
  const [isCompact, setIsCompact] = useState(false);
  const [showSystemEvents, setShowSystemEvents] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const filteredLogs = useMemo(() => {
    return initialLogs.filter((log) => {
      let details: any = {};
      try {
        details = log.details ? JSON.parse(log.details) : {};
      } catch (e) {}

      // 0. System Events Preference
      const isSystem = log.action !== "CELL_EXECUTION" && log.action !== "SHELL_CMD";
      if (!showSystemEvents && isSystem) return false;

      // 1. Status Filter
      if (filterStatus === "SUCCESS" && details.success === false) return false;
      if (filterStatus === "ERROR" && details.success !== false) return false;

      // 2. Type Filter
      if (filterType !== "ALL" && filterType !== "OTHER" && log.action !== filterType) return false;
      if (filterType === "OTHER" && (log.action === "CELL_EXECUTION" || log.action === "SHELL_CMD")) return false;

      // 3. Search Filter
      if (!search) return true;
      const searchLower = search.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(searchLower);
      const matchCode = details.code?.toLowerCase().includes(searchLower);
      const matchCmd = details.cmd?.toLowerCase().includes(searchLower);
      const matchPath = details.path?.toLowerCase().includes(searchLower);

      return matchAction || matchCode || matchCmd || matchPath;
    });
  }, [initialLogs, search, filterStatus, filterType, showSystemEvents]);

  return (
    <div className="rounded-xl border border-slate-100 bg-white">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-4 border-b border-slate-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
            <h3 className="hidden text-xs font-bold text-slate-500 uppercase tracking-widest lg:block mr-2">Insights</h3>
            <div className="relative flex-1 max-w-md">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </span>
                <input
                    type="text"
                    placeholder="Search code, commands, or files..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600 focus:border-indigo-300 focus:outline-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">ALL STATUS</option>
            <option value="SUCCESS">SUCCESS ONLY</option>
            <option value="ERROR">ERRORS ONLY</option>
          </select>

          {/* Type Filter */}
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600 focus:border-indigo-300 focus:outline-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">ALL TYPES</option>
            <option value="CELL_EXECUTION">PYTHON CELLS</option>
            <option value="SHELL_CMD">TERMINAL</option>
            <option value="OTHER">SYSTEM</option>
          </select>

          {/* Properties Toggle */}
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                isSettingsOpen ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
            }`}
            title="Insights Properties"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Settings Sub-Panel */}
      {isSettingsOpen && (
        <div className="flex flex-wrap items-center gap-6 bg-slate-50/50 px-6 py-3 border-b border-slate-50 animate-in fade-in slide-in-from-top-1 duration-200">
            <label className="flex cursor-pointer items-center gap-2 group">
                <input 
                    type="checkbox" 
                    className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                    checked={isCompact}
                    onChange={(e) => setIsCompact(e.target.checked)}
                />
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-700 uppercase tracking-tight">Compact View</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 group">
                <input 
                    type="checkbox" 
                    className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                    checked={showSystemEvents}
                    onChange={(e) => setShowSystemEvents(e.target.checked)}
                />
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-700 uppercase tracking-tight">Show System Events</span>
            </label>
            <div className="ml-auto text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                {filteredLogs.length} OF {initialLogs.length} SHOWN
            </div>
        </div>
      )}

      <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto custom-scrollbar">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <ActivityItem key={log.id} log={log} isCompact={isCompact} />
          ))
        ) : (
          <div className="py-12 text-center text-sm text-slate-400 italic">
            {search || filterStatus !== "ALL" || filterType !== "ALL" || !showSystemEvents
                ? "No matches found for your filters." 
                : "No activity patterns detected yet."}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ log, isCompact }: { log: any, isCompact: boolean }) {
    let details: any = null;
    try {
        details = log.details ? JSON.parse(log.details) : null;
    } catch(e) {}

    const isError = details?.success === false;
    const isCode = log.action === "CELL_EXECUTION";
    const isShell = log.action === "SHELL_CMD";

    const content = (
        <div className="border-t border-slate-50 bg-slate-50/30 px-6 py-4 text-xs">
            {isCode && (
                <div className="space-y-2">
                    <p className="font-bold text-slate-500 uppercase tracking-tighter">Executed Code:</p>
                    <pre className="overflow-x-auto rounded-md bg-slate-900 p-3 text-slate-300">
                        <code>{details?.code}</code>
                    </pre>
                </div>
            )}
            {isShell && (
                <div className="flex gap-2 items-center">
                    <span className="text-slate-400 font-mono">$</span>
                    <code className="text-slate-700 font-bold">{details?.cmd}</code>
                </div>
            )}
            {isError && (
                <div className="mt-2 rounded-md border border-red-100 bg-red-50/50 p-3 text-red-700">
                    <p className="font-bold">{details?.error_type}</p>
                    <p className="font-mono mt-1 text-[10px] whitespace-pre-wrap">{details?.error_msg}</p>
                </div>
            )}
            {!isCode && !isShell && !isError && (
                <p className="text-slate-500 italic">No additional details available.</p>
            )}
        </div>
    );

    if (isCompact) {
        return (
            <div className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                        isError ? "bg-red-100 text-red-600" : 
                        isCode ? "bg-blue-100 text-blue-600" :
                        isShell ? "bg-amber-100 text-amber-600" :
                        "bg-slate-100 text-slate-600"
                    }`}>
                        {isError ? "!" : isCode ? "PY" : isShell ? ">_" : "i"}
                    </span>
                    <p className={`text-xs font-medium truncate ${isError ? "text-red-700" : "text-slate-700"}`}>
                        {log.action}
                        {details?.path && <span className="ml-2 text-[10px] font-normal text-slate-400">/ {details.path.split('/').pop()}</span>}
                    </p>
                </div>
                <p className="text-[9px] font-bold text-slate-300 uppercase">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        );
    }

    return (
        <details className="group">
            <summary className="flex cursor-pointer items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors list-none">
                <div className="flex items-center gap-4">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        isError ? "bg-red-100 text-red-600" : 
                        isCode ? "bg-blue-100 text-blue-600" :
                        isShell ? "bg-amber-100 text-amber-600" :
                        "bg-slate-100 text-slate-600"
                    }`}>
                        {isError ? "!" : isCode ? "PY" : isShell ? ">_" : "i"}
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isError ? "text-red-700" : "text-slate-700"}`}>
                            {log.action}
                            {details?.path && <span className="ml-2 text-xs font-normal text-slate-400">in {details.path.split('/').pop()}</span>}
                        </p>
                        <p className="text-[10px] text-slate-400">
                            {new Date(log.timestamp).toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {details?.error_type && (
                        <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-500 uppercase">
                            {details.error_type}
                        </span>
                    )}
                    <svg className="h-4 w-4 text-slate-300 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </summary>
            {content}
        </details>
    );
}
