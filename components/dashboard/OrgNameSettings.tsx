"use client";

import { useState } from "react";
import { Loader2, Pencil, Check, X } from "lucide-react";

interface Props {
  initialName: string;
}

export function OrgNameSettings({ initialName }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [draft, setDraft] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!draft.trim() || draft === name) { setEditing(false); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
      setName(draft.trim());
      setEditing(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function cancel() {
    setDraft(name);
    setEditing(false);
    setError("");
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Organisation Name</h2>
      {editing ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
              autoFocus
              maxLength={80}
              className="glass-input flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            />
            <button
              onClick={save}
              disabled={loading || !draft.trim()}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </button>
            <button
              onClick={cancel}
              className="flex items-center justify-center w-10 h-10 rounded-xl glass-card text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50/80 rounded-xl px-3 py-2">{error}</p>}
        </div>
      ) : (
        <div className="flex items-center justify-between glass-card rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-slate-800">{name}</span>
          <button
            onClick={() => { setDraft(name); setEditing(true); }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 transition-colors min-h-[32px] px-2"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
