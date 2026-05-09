"use client";

import { useState } from "react";
import { Database, Sheet, Table2, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

type BackendType = "supabase" | "sheets" | "airtable";

interface OrgSettings {
  backend: BackendType;
  has_credentials: boolean;
}

interface Props {
  initial: OrgSettings;
}

export function BackendSettings({ initial }: Props) {
  const [backend, setBackend] = useState<BackendType>(initial.backend);
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [serviceAccountKey, setServiceAccountKey] = useState("");
  const [baseId, setBaseId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setResult(null);

    let body: Record<string, string>;
    if (backend === "supabase") {
      body = { backend };
    } else if (backend === "sheets") {
      if (!spreadsheetId || !serviceAccountKey) {
        setResult({ ok: false, msg: "Both Spreadsheet ID and Service Account Key are required." });
        setSaving(false);
        return;
      }
      body = { backend, spreadsheet_id: spreadsheetId, service_account_key: serviceAccountKey };
    } else {
      if (!baseId || !apiKey) {
        setResult({ ok: false, msg: "Both Base ID and API Key are required." });
        setSaving(false);
        return;
      }
      body = { backend, base_id: baseId, api_key: apiKey };
    }

    try {
      const res = await fetch("/api/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, msg: data.error ?? "Save failed" });
      } else {
        setResult({ ok: true, msg: "Settings saved successfully." });
        setSpreadsheetId("");
        setServiceAccountKey("");
        setBaseId("");
        setApiKey("");
      }
    } catch {
      setResult({ ok: false, msg: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  const BACKENDS = [
    { id: "supabase" as const, label: "Supabase", icon: Database, desc: "Default — hosted PostgreSQL" },
    { id: "sheets" as const, label: "Google Sheets", icon: Sheet, desc: "Store issues in a spreadsheet" },
    { id: "airtable" as const, label: "Airtable", icon: Table2, desc: "Store issues in an Airtable base" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Storage Backend</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Choose where new issues are stored. Locations always stay in Supabase.
        </p>
      </div>

      <div className="space-y-2">
        {BACKENDS.map(({ id, label, icon: Icon, desc }) => (
          <button
            key={id}
            type="button"
            onClick={() => setBackend(id)}
            className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 min-h-[56px] ${
              backend === id
                ? "bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 shadow-sm"
                : "glass-card text-slate-700 hover:border-indigo-100"
            }`}
          >
            <Icon className={`h-5 w-5 shrink-0 ${backend === id ? "text-indigo-600" : "text-slate-400"}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${backend === id ? "text-indigo-900" : "text-slate-800"}`}>{label}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
            {initial.backend === id && initial.has_credentials !== false && (
              <span className="text-xs text-indigo-600 font-semibold shrink-0">Active</span>
            )}
          </button>
        ))}
      </div>

      {backend === "sheets" && (
        <div className="glass-card space-y-3 rounded-2xl p-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Spreadsheet ID</label>
            <input
              type="text"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
              className="glass-input w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            />
            <p className="text-xs text-slate-400">Found in the Google Sheets URL after /d/</p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Service Account Key (JSON)</label>
            <textarea
              value={serviceAccountKey}
              onChange={(e) => setServiceAccountKey(e.target.value)}
              placeholder='{"type":"service_account","project_id":"...","private_key":"..."}'
              rows={5}
              className="glass-input w-full rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none resize-none"
            />
            <p className="text-xs text-slate-400">Paste the full JSON from your Google Cloud service account</p>
          </div>
        </div>
      )}

      {backend === "airtable" && (
        <div className="glass-card space-y-3 rounded-2xl p-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Base ID</label>
            <input
              type="text"
              value={baseId}
              onChange={(e) => setBaseId(e.target.value)}
              placeholder="appXXXXXXXXXXXXXX"
              className="glass-input w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            />
            <p className="text-xs text-slate-400">Found in your Airtable base URL after airtable.com/</p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Personal Access Token</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="pat•••••••••••••••"
              className="glass-input w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            />
            <p className="text-xs text-slate-400">Create one at airtable.com/create/tokens with data.records:write scope</p>
          </div>
        </div>
      )}

      {result && (
        <div className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
          result.ok ? "bg-emerald-50/80 text-emerald-800" : "bg-red-50/80 text-red-800"
        }`}>
          {result.ok
            ? <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" />
            : <AlertCircle className="h-4 w-4 mt-0.5 text-red-500 shrink-0" />}
          {result.msg}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saving ? "Saving…" : "Save Settings"}
      </button>
    </div>
  );
}
