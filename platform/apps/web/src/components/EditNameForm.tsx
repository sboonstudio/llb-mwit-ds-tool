"use client";

import React, { useState } from "react";
import { updateUserName } from "@/actions/user";

export default function EditNameForm({ initialName, canEdit }: { initialName: string, canEdit: boolean }) {
  const [isEditing, setIsCompact] = useState(false);
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canEdit) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">{initialName || "No Name"}</span>
        </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name === initialName) {
        setIsCompact(false);
        return;
    }

    setLoading(true);
    setError(null);
    
    const result = await updateUserName(name);
    
    if (result?.success) {
      setIsCompact(false);
    } else {
      setError(result?.error || "Failed to update name");
    }
    setLoading(false);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
            <input
                type="text"
                className="rounded border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                disabled={loading}
            />
            <button
                type="submit"
                disabled={loading}
                className="rounded bg-indigo-600 px-3 py-1 text-[10px] font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
                {loading ? "SAVING..." : "SAVE"}
            </button>
            <button
                type="button"
                onClick={() => { setName(initialName); setIsCompact(false); setError(null); }}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
            >
                CANCEL
            </button>
        </div>
        {error && <p className="text-[10px] font-medium text-red-500">{error}</p>}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <span className="text-sm font-medium text-slate-700">{initialName || "Click to add name"}</span>
      <button
        onClick={() => setIsCompact(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-indigo-500 hover:text-indigo-700"
      >
        EDIT
      </button>
    </div>
  );
}
