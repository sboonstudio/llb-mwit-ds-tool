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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = (expand: boolean) => {
    const newState: Record<string, boolean> = {};
    if (expand) {
      groupedData.forEach(g => newState[g.id] = true);
    }
    setExpandedGroups(newState);
  };

  interface ActivityGroup {
    id: string;
    title: string;
    type: 'FILE' | 'ENV' | 'OTHER';
    path?: string;
    logs: any[];
    lastTimestamp: string | Date;
    hasError: boolean;
    stats: {
      success: number;
      error: number;
      total: number;
    };
  }

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

  const groupedData = useMemo(() => {
    const groups: Record<string, ActivityGroup> = {};

    filteredLogs.forEach(log => {
      let details: any = {};
      try { details = log.details ? JSON.parse(log.details) : {}; } catch(e) {}

      let groupKey = "";
      let groupTitle = "";
      let groupType: 'FILE' | 'ENV' | 'OTHER' = 'OTHER';

      const isEnv = ["LAB_SPAWN", "LAB_STOP", "KERNEL_START", "KERNEL_STOP"].includes(log.action) || 
                    log.action.includes("JupyterHub Launch");

      if (isEnv) {
        groupKey = "ENVIRONMENT";
        groupTitle = "Environment Lifecycle";
        groupType = 'ENV';
      } else if (log.action === "CELL_EXECUTION" || log.action.startsWith("FILE_")) {
        const path = details.path || "unknown";
        groupKey = `FILE:${path}`;
        groupTitle = path.split('/').pop() || path;
        groupType = 'FILE';
      } else {
        groupKey = "OTHER";
        groupTitle = "Other Activities";
        groupType = 'OTHER';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: groupKey,
          title: groupTitle,
          type: groupType,
          path: details.path,
          logs: [],
          lastTimestamp: log.timestamp,
          hasError: false,
          stats: { success: 0, error: 0, total: 0 }
        };
      }

      groups[groupKey].logs.push(log);
      groups[groupKey].stats.total++;
      if (details.success === false) {
          groups[groupKey].hasError = true;
          groups[groupKey].stats.error++;
      } else {
          groups[groupKey].stats.success++;
      }

      if (new Date(log.timestamp) > new Date(groups[groupKey].lastTimestamp)) {
        groups[groupKey].lastTimestamp = log.timestamp;
      }
    });

    return Object.values(groups).sort((a, b) => 
      new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
    );
  }, [filteredLogs]);

  // --- NEW: Adaptive KPI Calculation ---
  const kpis = useMemo(() => {
    const executions = filteredLogs.filter(l => l.action === "CELL_EXECUTION");
    const total = executions.length;
    const errors = executions.filter(l => {
        try { return JSON.parse(l.details || "{}").success === false; } catch(e) { return false; }
    }).length;
    
    const successRate = total > 0 ? Math.round(((total - errors) / total) * 100) : 100;

    // Most active file in filtered set
    const fileCounts: Record<string, number> = {};
    executions.forEach(l => {
        try {
            const path = JSON.parse(l.details || "{}").path || "unknown";
            fileCounts[path] = (fileCounts[path] || 0) + 1;
        } catch(e) {}
    });
    const topFile = Object.entries(fileCounts).sort((a, b) => b[1] - a[1])[0]?.[0].split('/').pop() || "N/A";

    return { total, successRate, topFile, errorCount: errors };
  }, [filteredLogs]);

  return (
    <div className="space-y-6">
      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button 
            onClick={() => { setFilterType("CELL_EXECUTION"); setFilterStatus("ALL"); }}
            className="group text-left rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-md hover:border-indigo-100"
          >
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Execution Volume</p>
              <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-800">{kpis.total}</span>
                  <span className="text-[10px] text-slate-400 font-medium">runs</span>
              </div>
              <p className="mt-1 text-[9px] text-indigo-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">VIEW ALL CODE RUNS →</p>
          </button>

          <button 
            onClick={() => { setFilterStatus("ERROR"); setFilterType("CELL_EXECUTION"); }}
            className={`group text-left rounded-xl border p-4 transition-all hover:bg-white hover:shadow-md ${
                kpis.successRate < 70 ? "border-red-100 bg-red-50/30 hover:border-red-200" : "border-emerald-100 bg-emerald-50/30 hover:border-emerald-200"
            }`}
          >
              <p className={`text-[10px] font-bold uppercase tracking-wider ${kpis.successRate < 70 ? "text-red-400" : "text-emerald-400"}`}>Success Precision</p>
              <div className="mt-1 flex items-baseline gap-2">
                  <span className={`text-3xl font-black ${kpis.successRate < 70 ? "text-red-600" : "text-emerald-600"}`}>{kpis.successRate}%</span>
                  <span className={`text-[10px] font-medium ${kpis.successRate < 70 ? "text-red-400" : "text-emerald-400"}`}>accuracy</span>
              </div>
              <p className={`mt-1 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity ${kpis.successRate < 70 ? "text-red-500" : "text-emerald-500"}`}>
                  {kpis.errorCount > 0 ? `INVESTIGATE ${kpis.errorCount} ERRORS →` : "PERFECT STABILITY"}
              </p>
          </button>

          <button 
            onClick={() => setSearch(kpis.topFile !== "N/A" ? kpis.topFile : "")}
            className="group text-left rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-md hover:border-blue-100"
          >
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Primary Workspace</p>
              <div className="mt-1">
                  <p className="truncate text-lg font-bold text-slate-800" title={kpis.topFile}>{kpis.topFile}</p>
                  <p className="text-[10px] text-blue-400 font-medium">active focus</p>
              </div>
              <p className="mt-1 text-[9px] text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase">Filter by this file →</p>
          </button>
      </div>

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
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => toggleAll(true)}
                    className="text-[9px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-tighter"
                >
                    Expand All
                </button>
                <span className="text-slate-300">|</span>
                <button 
                    onClick={() => toggleAll(false)}
                    className="text-[9px] font-bold text-slate-500 hover:text-slate-600 uppercase tracking-tighter"
                >
                    Collapse All
                </button>
            </div>
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

      <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
        {groupedData.length > 0 ? (
          groupedData.map((group) => {
            const isExpanded = expandedGroups[group.id];
            const successRate = Math.round((group.stats.success / (group.stats.total || 1)) * 100);

            return (
              <div key={group.id} className="border-b border-slate-50 last:border-0">
                  {/* Group Header (Interactive Summary) */}
                  <button 
                    onClick={() => toggleGroup(group.id)}
                    className={`sticky top-0 z-10 flex w-full items-center justify-between px-6 py-3 transition-all hover:bg-slate-100/80 ${
                      group.hasError ? "bg-red-50/90" : "bg-slate-50/90"
                    } backdrop-blur-md`}
                  >
                      <div className="flex flex-1 items-center gap-4">
                          <div className="flex items-center gap-2">
                              <span className={`flex h-5 w-5 items-center justify-center rounded-md text-xs ${
                                  group.type === 'FILE' ? "bg-blue-100 text-blue-600" : 
                                  group.type === 'ENV' ? "bg-slate-200 text-slate-600" : 
                                  "bg-amber-100 text-amber-600"
                              }`}>
                                  {group.type === 'FILE' ? "📗" : group.type === 'ENV' ? "⚙️" : "📦"}
                              </span>
                              <h4 className={`text-[11px] font-black uppercase tracking-wider ${
                                  group.hasError ? "text-red-700" : "text-slate-700"
                              }`}>
                                  {group.title}
                              </h4>
                          </div>

                          {/* Aggregate Metadata (Success Bar) */}
                          {group.type === 'FILE' && (
                              <div className="hidden items-center gap-3 md:flex">
                                  <div className="h-1.5 w-24 rounded-full bg-slate-200 overflow-hidden shadow-inner">
                                      <div 
                                          className={`h-full transition-all duration-500 ${successRate === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
                                          style={{ width: `${successRate}%` }}
                                      ></div>
                                  </div>
                                  <span className={`text-[9px] font-bold ${successRate < 70 ? "text-red-500" : "text-slate-400"}`}>
                                      {successRate}% SUCCESS
                                  </span>
                              </div>
                          )}
                      </div>

                      <div className="flex items-center gap-6">
                          <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-500 uppercase">
                                  {group.stats.total} {group.stats.total === 1 ? 'Action' : 'Actions'}
                              </p>
                              <p className="text-[9px] font-mono text-slate-300">
                                  LAST: {new Date(group.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                          </div>
                          <svg className={`h-4 w-4 text-slate-300 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                      </div>
                  </button>

                  {/* Nested Logs (Conditionally Rendered) */}
                  {isExpanded && (
                    <div className="divide-y divide-slate-50/50 bg-white/30 animate-in fade-in slide-in-from-top-1 duration-200">
                        {group.logs.map((log) => (
                            <ActivityItem key={log.id} log={log} isCompact={isCompact} />
                        ))}
                    </div>
                  )}
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-sm text-slate-400 italic">
            {search || filterStatus !== "ALL" || filterType !== "ALL" || !showSystemEvents
                ? "No matches found for your filters." 
                : "No activity patterns detected yet."}
          </div>
        )}
      </div>
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
    const isFile = log.action.startsWith("FILE_");

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
            {isFile && (
                <div className="flex gap-2 items-center">
                    <span className="text-slate-400 font-bold">📄 File:</span>
                    <code className="text-slate-700 font-bold">{details?.path}</code>
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
