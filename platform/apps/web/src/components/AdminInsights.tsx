"use client";

import React, { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";

export default function AdminInsights() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/insights")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 italic">Analysing learning patterns...</div>;

  // 1. Resource Usage Chart Options
  const usageOption = {
    title: { text: "System Resource Trends", textStyle: { fontSize: 14 } },
    tooltip: { trigger: "axis" },
    legend: { data: ["CPU %", "RAM MB"], bottom: 0 },
    grid: { left: "3%", right: "4%", bottom: "15%", containLabel: true },
    xAxis: {
      type: "category",
      data: data.usageTrend.map((u: any) => new Date(u.recordedAt).toLocaleTimeString()),
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "CPU %",
        type: "line",
        smooth: true,
        data: data.usageTrend.map((u: any) => u.cpuUsage),
        color: "#3b82f6",
      },
      {
        name: "RAM MB",
        type: "line",
        smooth: true,
        data: data.usageTrend.map((u: any) => u.memoryUsage),
        color: "#10b981",
      },
    ],
  };

  // 2. Error Distribution Chart Options
  const errorOption = {
    title: { text: "Common Learning Friction (Errors)", textStyle: { fontSize: 14 } },
    tooltip: { trigger: "item" },
    series: [
      {
        name: "Error Type",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: "#fff", borderWidth: 2 },
        label: { show: false, position: "center" },
        emphasis: { label: { show: true, fontSize: "16", fontWeight: "bold" } },
        labelLine: { show: false },
        data: data.errorDistribution,
      },
    ],
  };

  // 3. Engagement Calendar Heatmap
  const engagementOption = {
    title: { text: "Learning Engagement Heatmap", textStyle: { fontSize: 14 } },
    tooltip: { position: "top" },
    visualMap: {
      min: 0,
      max: 10,
      type: "piecewise",
      orient: "horizontal",
      left: "center",
      top: 30,
      inRange: { color: ["#f1f5f9", "#3b82f6"] },
    },
    calendar: {
      top: 80,
      left: 30,
      right: 30,
      cellSize: ["auto", 13],
      range: new Date().getFullYear().toString(),
      itemStyle: { borderWidth: 0.5 },
      yearLabel: { show: false },
    },
    series: {
      type: "heatmap",
      coordinateSystem: "calendar",
      data: data.engagementData,
    },
  };

  // 4. Top Active Users Bar Chart
  const topUsersOption = {
    title: { text: "Most Active Learners", textStyle: { fontSize: 14 } },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: { type: "value" },
    yAxis: { type: "category", data: data.topUsers.map((u: any) => u.name).reverse() },
    series: [
      {
        name: "Actions",
        type: "bar",
        data: data.topUsers.map((u: any) => u.value).reverse(),
        color: "#6366f1",
        label: { show: true, position: "right" },
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <ReactECharts option={usageOption} style={{ height: "300px" }} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <ReactECharts option={topUsersOption} style={{ height: "300px" }} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="col-span-1 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
          <ReactECharts option={engagementOption} style={{ height: "250px" }} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <ReactECharts option={errorOption} style={{ height: "250px" }} />
        </div>
      </div>
    </div>
  );
}
