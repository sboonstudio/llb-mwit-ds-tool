"use client";

import React, { useEffect, useState, useMemo } from "react";

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");

  useEffect(() => {
    fetch("/api/admin/logs?limit=200")
      .then((res) => res.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      });
  }, []);

  const actionTypes = useMemo(() => {
    const types = new Set(logs.map((l) => l.action));
    return Array.from(types).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        (log.user?.name?.toLowerCase().includes(searchLower) || false) ||
        (log.user?.email?.toLowerCase().includes(searchLower) || false) ||
        log.action.toLowerCase().includes(searchLower) ||
        (log.details?.toLowerCase().includes(searchLower) || false);

      const matchesAction = filterAction === "ALL" || log.action === filterAction;

      return matchesSearch && matchesAction;
    });
  }, [logs, search, filterAction]);

  if (loading) return <div className="p-8 text-center text-slate-500 italic text-sm font-medium">Retrieving system records...</div>;

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search logs (User, Action, Details)..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-nowrap">Filter Event:</label>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 focus:border-indigo-500 focus:outline-none shadow-sm"
          >
            <option value="ALL">ALL EVENTS</option>
            {actionTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <div className="h-8 w-px bg-slate-100 hidden md:block mx-1"></div>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100 uppercase whitespace-nowrap">
            {filteredLogs.length} Records Found
          </span>
        </div>
      </div>

      {/* Log Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Timestamp</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Actor</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Action</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Event Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-xs font-semibold text-slate-700">{new Date(log.timestamp).toLocaleDateString()}</div>
                  <div className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-xs font-bold text-slate-900">{log.user?.name || "System"}</div>
                  <div className="text-[10px] text-slate-500">{log.user?.email || "internal@service"}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                    log.action.startsWith('ADMIN_') ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                    log.action.includes('STOP') ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    log.action.includes('SPAWN') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4">
                    {log.details ? (
                        <div className="max-w-md">
                            <pre className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 overflow-x-auto whitespace-pre-wrap font-mono">
                                {log.details}
                            </pre>
                        </div>
                    ) : (
                        <span className="text-[10px] text-slate-300 italic">No additional data</span>
                    )}
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-400 italic bg-slate-50/30 font-medium">
                   No log records found matching your current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
