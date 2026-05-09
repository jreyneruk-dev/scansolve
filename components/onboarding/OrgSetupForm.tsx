"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

export function OrgSetupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ name: string; orgNumber: number } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Organization name is required."); return; }
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      // Show org number before entering the dashboard
      setCreated({ name: data.name, orgNumber: data.org_number });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Success state — org number shown prominently ──────────────────────────
  if (created) {
    return (
      <div className="glass-card rounded-3xl p-6 space-y-5 text-center animate-slide-in">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/25">
          <CheckCircle2 className="h-7 w-7 text-white" />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">{created.name} is ready!</h2>
          <p className="text-sm text-slate-500">Your organisation has been created.</p>
        </div>

        {/* Org number — make it memorable */}
        <div className="rounded-2xl bg-indigo-50/80 border border-indigo-100 px-4 py-4 space-y-1">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">
            Your Organisation ID
          </p>
          <p className="text-4xl font-bold text-indigo-700 font-mono tracking-tight">
            #{created.orgNumber}
          </p>
          <p className="text-xs text-slate-400 pt-1 leading-relaxed">
            This ID is embedded in every QR label you print.<br />Make a note of it.
          </p>
        </div>

        <button
          onClick={() => { router.push("/dashboard"); router.refresh(); }}
          className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  // ── Form state ─────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 space-y-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Organization name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Acme Facilities"
          autoFocus
          className="glass-input w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50/80 rounded-xl px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Creating…" : "Create Organization"}
      </button>
    </form>
  );
}
