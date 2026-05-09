"use client";
import { useState, useEffect, useCallback } from "react";
import { Printer, Tag, Loader2, RefreshCw, History } from "lucide-react";
import { PrintPreviewModal } from "./PrintPreviewModal";
import { ClientDate } from "@/components/ui/ClientDate";

const SHEET_OPTIONS = [
  { value: "avery_l7165", label: "Avery L7165 — 2×4, 8 labels/sheet", labelsPerSheet: 8, available: true },
  { value: "avery_l7163", label: "Avery L7163 — 2×7, 14 labels/sheet", labelsPerSheet: 14, available: false },
  { value: "avery_l7160", label: "Avery L7160 — 3×7, 21 labels/sheet", labelsPerSheet: 21, available: false },
  { value: "avery_l7166", label: "Avery L7166 — 2×3, 6 labels/sheet", labelsPerSheet: 6, available: false },
];

interface PrintJob {
  id: string;
  sheetTypeLabel: string;
  sheets: number;
  quantityLabels: number;
  uidStart: string;
  uidEnd: string;
  printedAt: string;
  printedBy: string;
}

interface PreviewData {
  uids: string[];
  orgNumber: number;
  sheetType: string;
}

interface LabelsClientProps {
  orgNumber: number;
  appUrl: string;
}

export function LabelsClient({ orgNumber, appUrl }: LabelsClientProps) {
  const [sheetType, setSheetType] = useState("avery_l7165");
  const [sheets, setSheets] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [history, setHistory] = useState<PrintJob[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/labels/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.jobs ?? []);
      }
    } catch {
      // Silent fail — history is non-critical
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const selectedSheet = SHEET_OPTIONS.find((o) => o.value === sheetType)!;
  const totalLabels = sheets * selectedSheet.labelsPerSheet;

  async function handlePreviewAndPrint() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/labels/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetType, sheets }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to reserve labels");
      setPreview({ uids: data.uids, orgNumber: data.orgNumber, sheetType });
      // Refresh history after reserving
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Print new labels section */}
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Tag className="h-4 w-4 text-indigo-500" />
          Print New Labels
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sheet type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Label Sheet
            </label>
            <select
              value={sheetType}
              onChange={(e) => setSheetType(e.target.value)}
              className="glass-input w-full h-11 rounded-xl px-3 text-sm text-slate-700 font-medium cursor-pointer"
            >
              {SHEET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={!opt.available}>
                  {opt.label}{!opt.available ? " (coming soon)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Number of sheets */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Number of Sheets
            </label>
            <select
              value={sheets}
              onChange={(e) => setSheets(parseInt(e.target.value, 10))}
              className="glass-input w-full h-11 rounded-xl px-3 text-sm text-slate-700 font-medium cursor-pointer"
            >
              {[1,2,3,4,5,6,7,8,9].map((n) => (
                <option key={n} value={n}>{n} sheet{n > 1 ? "s" : ""}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary */}
        <p className="text-xs text-slate-500">
          {sheets} sheet{sheets > 1 ? "s" : ""} × {selectedSheet.labelsPerSheet} labels ={" "}
          <strong className="text-slate-700">{totalLabels} labels</strong> will be printed and reserved.
        </p>

        {error && (
          <p className="text-xs text-red-600 bg-red-50/80 rounded-xl px-3 py-2">{error}</p>
        )}

        <button
          onClick={handlePreviewAndPrint}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Printer className="h-4 w-4" />
              Preview &amp; Print
            </>
          )}
        </button>
      </div>

      {/* History section */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <History className="h-4 w-4 text-indigo-500" />
            Print History
          </div>
          <button
            onClick={loadHistory}
            disabled={historyLoading}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${historyLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {historyLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            No labels printed yet — print your first batch above.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 border-b border-white/50">
                  <th className="pb-2 px-2 font-semibold">Date</th>
                  <th className="pb-2 px-2 font-semibold">Printed by</th>
                  <th className="pb-2 px-2 font-semibold">Sheet type</th>
                  <th className="pb-2 px-2 font-semibold text-right">Sheets</th>
                  <th className="pb-2 px-2 font-semibold text-right">Labels</th>
                  <th className="pb-2 px-2 font-semibold">UID range</th>
                </tr>
              </thead>
              <tbody>
                {history.map((job) => (
                  <tr key={job.id} className="border-b border-white/30 last:border-0">
                    <td className="py-2 px-2 text-slate-600 whitespace-nowrap">
                      <ClientDate iso={job.printedAt} />
                    </td>
                    <td className="py-2 px-2 text-slate-600 max-w-[140px] truncate">
                      {job.printedBy}
                    </td>
                    <td className="py-2 px-2 text-slate-500 whitespace-nowrap">
                      {job.sheetTypeLabel}
                    </td>
                    <td className="py-2 px-2 text-slate-600 text-right">{job.sheets}</td>
                    <td className="py-2 px-2 text-slate-600 text-right">{job.quantityLabels}</td>
                    <td className="py-2 px-2 font-mono text-slate-700 whitespace-nowrap">
                      {job.uidStart === job.uidEnd
                        ? job.uidStart
                        : `${job.uidStart} – ${job.uidEnd}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print preview modal */}
      {preview && (
        <PrintPreviewModal
          uids={preview.uids}
          orgNumber={preview.orgNumber}
          sheetType={preview.sheetType}
          appUrl={appUrl}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
