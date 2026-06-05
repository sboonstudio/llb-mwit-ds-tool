"use client";

import { useState, useEffect } from "react";
import { getSystemConfig, updateSystemConfig, performLogRotation } from "@/actions/system";

export default function SystemSettings() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const data = await getSystemConfig();
      setConfig(data);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load configuration" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const result = await updateSystemConfig({
        retentionDays: parseInt(config.retentionDays),
        autoRotate: config.autoRotate,
        errorThreshold: parseInt(config.errorThreshold),
        alertWindowMins: parseInt(config.alertWindowMins),
        notifyEmail: config.notifyEmail,
        enableAlerts: config.enableAlerts,
      });
      if (result.success) {
        setMessage({ type: "success", text: "Settings updated successfully" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update settings" });
    } finally {
      setSaving(false);
    }
  }

  async function handleRotate() {
    if (!confirm("Are you sure you want to perform log rotation now? This will delete logs older than your retention period.")) {
      return;
    }
    setRotating(true);
    setMessage(null);
    try {
      const result = await performLogRotation();
      if (result.success) {
        setMessage({ type: "success", text: `Log rotation complete. Deleted ${result.deletedCount} logs.` });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Log rotation failed" });
    } finally {
      setRotating(false);
    }
  }

  if (loading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="space-y-8">
      {message && (
        <div className={`rounded-md p-4 ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Log Rotation Section */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600">📦</span>
            Log Rotation Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Retention Period (Days)</label>
              <input
                type="number"
                value={config.retentionDays}
                onChange={(e) => setConfig({ ...config, retentionDays: e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">Logs older than this will be removed during rotation.</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoRotate"
                checked={config.autoRotate}
                onChange={(e) => setConfig({ ...config, autoRotate: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="autoRotate" className="text-sm font-medium text-slate-700">Enable automatic rotation</label>
            </div>
            <div className="pt-4 border-t border-slate-100">
                <button
                    type="button"
                    onClick={handleRotate}
                    disabled={rotating}
                    className="w-full rounded-md bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 border border-amber-200 hover:bg-amber-100 disabled:opacity-50"
                >
                    {rotating ? "Rotating..." : "Perform Manual Rotation Now"}
                </button>
            </div>
          </div>
        </div>

        {/* System Alerts Section */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600">🔔</span>
            Intelligence Alerts
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enableAlerts"
                checked={config.enableAlerts}
                onChange={(e) => setConfig({ ...config, enableAlerts: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="enableAlerts" className="text-sm font-medium text-slate-700">Enable real-time error alerts</label>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Error Threshold</label>
                    <input
                        type="number"
                        value={config.errorThreshold}
                        onChange={(e) => setConfig({ ...config, errorThreshold: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Window (Minutes)</label>
                    <input
                        type="number"
                        value={config.alertWindowMins}
                        onChange={(e) => setConfig({ ...config, alertWindowMins: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Notification Email</label>
              <input
                type="email"
                value={config.notifyEmail || ""}
                onChange={(e) => setConfig({ ...config, notifyEmail: e.target.value })}
                placeholder="admin@example.com"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving Changes..." : "Save System Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}
