"use client";

import React, { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";

export default function IntelligenceDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch("/api/admin/intelligence")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch Error:", err);
        setLoading(false);
      });
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/intelligence/sync", { method: "POST" });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    setHasMounted(true);
    fetchData();
  }, []);

  if (!hasMounted || loading) return (
    <div className="flex flex-col items-center justify-center p-20 text-slate-500 italic">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mb-4"></div>
      Aggregating classroom intelligence...
    </div>
  );

  if (!data || data.topics.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-20 text-center">
        <p className="text-slate-500 mb-4">No intelligence data found yet.</p>
        <button 
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex h-10 items-center rounded-md bg-indigo-600 px-6 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {syncing ? "Syncing..." : "Sync Now"}
        </button>
      </div>
    );
  }

  // 1. Topic Performance (Bar Chart)
  const topicOption = {
    title: { text: "Topic Performance (Success vs Error)", textStyle: { fontSize: 14 } },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { data: ["Success", "Error"], bottom: 0 },
    grid: { left: "3%", right: "4%", bottom: "15%", containLabel: true },
    xAxis: { type: "category", data: data.topics.map((t: any) => t.name) },
    yAxis: { type: "value" },
    series: [
      {
        name: "Success",
        type: "bar",
        stack: "total",
        data: data.topics.map((t: any) => t.success),
        color: "#10b981",
      },
      {
        name: "Error",
        type: "bar",
        stack: "total",
        data: data.topics.map((t: any) => t.error),
        color: "#ef4444",
      },
    ],
  };

  // 2. Lifecycle Ops (Pie Chart)
  const envLifecycleOption = {
    title: { text: "Environment Readiness (Lifecycle)", textStyle: { fontSize: 14 } },
    tooltip: { trigger: "item" },
    legend: { orient: "vertical", left: "left", top: "center", textStyle: { fontSize: 10 } },
    series: [
      {
        name: "Actions",
        type: "pie",
        radius: ["40%", "70%"],
        center: ["60%", "50%"],
        data: data.envLifecycle,
        itemStyle: { borderRadius: 8, borderColor: "#fff", borderWidth: 2 },
      },
    ],
  };

  // 3. Workspace Ops (Pie Chart)
  const workspaceOption = {
    title: { text: "Workspace Management", textStyle: { fontSize: 14 } },
    tooltip: { trigger: "item" },
    legend: { orient: "vertical", left: "left", top: "center", textStyle: { fontSize: 10 } },
    series: [
      {
        name: "Actions",
        type: "pie",
        radius: ["40%", "70%"],
        center: ["60%", "50%"],
        data: data.workspace,
        itemStyle: { borderRadius: 8, borderColor: "#fff", borderWidth: 2 },
      },
    ],
  };

  // 4. Language Distribution
  const languageOption = {
    title: { text: "Execution Languages", textStyle: { fontSize: 14 } },
    tooltip: { trigger: "item" },
    series: [
      {
        name: "Lang",
        type: "pie",
        radius: "70%",
        data: data.languages,
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: "rgba(0, 0, 0, 0.5)" } },
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Auto-Sync Active (Every 10m)
              </p>
          </div>
          <div className="flex items-center gap-4">
              {data.lastSyncedAt && (
                  <p className="text-[10px] font-medium text-slate-400">
                      Last Updated: {new Date(data.lastSyncedAt).toLocaleString()}
                  </p>
              )}
              <button 
                onClick={handleSync}
                disabled={syncing}
                className="inline-flex h-8 items-center gap-2 rounded-md bg-white border border-slate-200 px-3 text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                <svg className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {syncing ? "SYNCING..." : "SYNC NOW"}
              </button>
          </div>
      </div>

      {/* 1. Hierarchical Topic Analysis */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-slate-700">File-Centric Learning Progress</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-slate-100 text-slate-400">
                        <th className="pb-2 font-medium">Topic / Filename</th>
                        <th className="pb-2 font-medium">Executions</th>
                        <th className="pb-2 font-medium">Success Rate</th>
                        <th className="pb-2 font-medium">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {data.topics.map((topic: any, tIdx: number) => (
                        <React.Fragment key={tIdx}>
                            <tr className="bg-slate-50 font-bold text-slate-700">
                                <td className="py-2 pl-2">📁 {topic.name}</td>
                                <td className="py-2">{topic.total}</td>
                                <td className="py-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-24 rounded-full bg-slate-200 overflow-hidden">
                                            <div 
                                                className="h-full bg-indigo-500" 
                                                style={{ width: `${(topic.success / (topic.total || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                        {Math.round((topic.success / (topic.total || 1)) * 100)}%
                                    </div>
                                </td>
                                <td className="py-2">
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${(topic.error / (topic.total || 1)) > 0.3 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
                                        {(topic.error / (topic.total || 1)) > 0.3 ? "STRUGGLING" : "STABLE"}
                                    </span>
                                </td>
                            </tr>
                            {topic.files.map((file: any, fIdx: number) => (
                                <tr key={fIdx} className="border-b border-slate-50 text-slate-600 hover:bg-slate-50/50">
                                    <td className="py-2 pl-8">📄 {file.name}</td>
                                    <td className="py-2">{file.success + file.error}</td>
                                    <td className="py-2">
                                        {Math.round((file.success / ((file.success + file.error) || 1)) * 100)}%
                                    </td>
                                    <td className="py-2">
                                        <span className={`h-2 w-2 rounded-full inline-block ${(file.error / ((file.success + file.error) || 1)) > 0 ? "bg-amber-400" : "bg-emerald-400"}`}></span>
                                    </td>
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Environment Readiness */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <ReactECharts option={envLifecycleOption} style={{ height: "300px" }} />
        </div>

        {/* Workspace Operations */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <ReactECharts option={workspaceOption} style={{ height: "300px" }} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <ReactECharts option={languageOption} style={{ height: "300px" }} />
        </div>
        
        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
           <h3 className="mb-4 text-sm font-bold text-slate-700">Quick Insights</h3>
           <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-100">
                <p className="text-xs font-medium text-emerald-600 uppercase">Most Stable Topic</p>
                <p className="text-xl font-bold text-emerald-900">
                    {data.topics.length > 0 
                      ? data.topics.sort((a: any, b: any) => (a.error/(a.total || 1)) - (b.error/(b.total || 1)))[0]?.name 
                      : "N/A"}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 p-4 border border-red-100">
                <p className="text-xs font-medium text-red-600 uppercase">Top Struggle Point</p>
                <p className="text-xl font-bold text-red-900">
                    {data.topics.length > 0 
                      ? data.topics.sort((a: any, b: any) => (b.error/(b.total || 1)) - (a.error/(a.total || 1)))[0]?.name 
                      : "N/A"}
                </p>
              </div>
              <div className="rounded-lg bg-indigo-50 p-4 border border-indigo-100">
                <p className="text-xs font-medium text-indigo-600 uppercase">Primary Language</p>
                <p className="text-xl font-bold text-indigo-900">
                    {data.languages.length > 0 
                      ? data.languages.sort((a: any, b: any) => b.value - a.value)[0]?.name 
                      : "N/A"}
                </p>
              </div>
              <div className="rounded-lg bg-amber-50 p-4 border border-amber-100">
                <p className="text-xs font-medium text-amber-600 uppercase">Total Interactions</p>
                <p className="text-xl font-bold text-amber-900">
                    {data.topics.reduce((acc: number, t: any) => acc + t.total, 0).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-slate-800 p-4 border border-slate-700">
                <p className="text-xs font-medium text-slate-300 uppercase">Classroom Engagement</p>
                <p className="text-xl font-bold text-white">
                    {data.totalActiveMinutes || 0} <span className="text-xs font-normal text-slate-400">mins</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase">Across all sessions</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
