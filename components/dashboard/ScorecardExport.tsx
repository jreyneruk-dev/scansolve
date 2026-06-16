"use client";
import { Download } from "lucide-react";

type Row = Record<string, string | number>;

/** Client-side CSV download for the pilot scorecard — no server round-trip. */
export function ScorecardExport({ rows, filename }: { rows: Row[]; filename: string }) {
  function download() {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const esc = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={download}
      disabled={!rows.length}
      className="flex items-center gap-1.5 min-h-[36px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-40 transition-colors"
    >
      <Download className="h-3.5 w-3.5" />
      Export CSV
    </button>
  );
}
