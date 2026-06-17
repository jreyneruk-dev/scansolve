import { requireAuth, getOrgForUser } from "@/lib/auth";
import { getAdapter } from "@/lib/db";
import { getEffectivePlan } from "@/lib/plans";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3, Lock } from "lucide-react";
import { InsightsExport } from "@/components/dashboard/InsightsExport";
import type { Organization } from "@/types/schema";

const DAY_MS = 86_400_000;

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function fmtDuration(ms: number | null): string {
  if (ms == null) return "—";
  const h = ms / 3_600_000;
  if (h < 1) return `${Math.max(1, Math.round(ms / 60_000))} min`;
  if (h < 48) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} days`;
}

export default async function InsightsPage() {
  const user = await requireAuth("/dashboard/insights");
  const org = await getOrgForUser(user.id);
  if (!org) redirect("/onboarding");

  // Insights is a Prime feature. Pilots see it because they run on comp Prime.
  if (getEffectivePlan(org as unknown as Organization) === "free") {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Insights</h1>
            <p className="text-sm text-slate-500">Reports captured and resolution times across your locations.</p>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 mb-4">
            <Lock className="h-5 w-5 text-indigo-500" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Insights is a Prime feature</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            See how many issues get reported and how fast they are resolved, broken down by location. Upgrade to Prime to unlock it.
          </p>
          <Link
            href="/pricing"
            className="mt-5 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Upgrade to Prime
          </Link>
        </div>
      </div>
    );
  }

  const adapter = await getAdapter(org.id);
  const issues = await adapter.getIssuesByOrg(org.id, { limit: 2000 });

  const now = Date.now();
  const last30 = issues.filter((i) => now - new Date(i.created_at).getTime() <= 30 * DAY_MS).length;

  const resolutionMs = issues
    .filter((i) => i.status === "resolved" && i.resolved_at)
    .map((i) => new Date(i.resolved_at!).getTime() - new Date(i.created_at).getTime())
    .filter((n) => n >= 0);

  const resolvedCount = issues.filter((i) => i.status === "resolved").length;
  const overallMedian = median(resolutionMs);

  // Per-location aggregation
  type Agg = { name: string; uid: string; total: number; resolved: number; resMs: number[] };
  const byLoc = new Map<string, Agg>();
  for (const i of issues) {
    const key = i.location_id;
    if (!byLoc.has(key)) {
      byLoc.set(key, { name: i.location?.name ?? "Unknown", uid: i.location?.uid ?? "", total: 0, resolved: 0, resMs: [] });
    }
    const row = byLoc.get(key)!;
    row.total++;
    if (i.status === "resolved" && i.resolved_at) {
      row.resolved++;
      const d = new Date(i.resolved_at).getTime() - new Date(i.created_at).getTime();
      if (d >= 0) row.resMs.push(d);
    }
  }
  const locRows = [...byLoc.values()]
    .map((r) => ({ name: r.name, uid: r.uid, total: r.total, resolved: r.resolved, medianMs: median(r.resMs) }))
    .sort((a, b) => b.total - a.total);

  const csvRows = locRows.map((r) => ({
    location: r.name,
    uid: r.uid,
    reports: r.total,
    resolved: r.resolved,
    median_resolution: fmtDuration(r.medianMs),
  }));

  const cards = [
    { label: "Total reports", value: String(issues.length) },
    { label: "Last 30 days", value: String(last30) },
    { label: "Resolved", value: String(resolvedCount) },
    { label: "Median resolution", value: fmtDuration(overallMedian) },
  ];

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Insights</h1>
            <p className="text-sm text-slate-500">Reports captured and resolution times across your locations.</p>
          </div>
        </div>
        <InsightsExport rows={csvRows} filename="scansolve-insights.csv" />
      </div>

      {issues.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-slate-500">
          No reports yet. Once people scan your codes and log issues, this page shows adoption and resolution-time data.
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {cards.map((c) => (
              <div key={c.label} className="glass-card rounded-2xl p-4">
                <div className="text-2xl font-bold text-slate-900">{c.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{c.label}</div>
              </div>
            ))}
          </div>

          {/* Per-location table */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">By location</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/70">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Location</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Reports</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Resolved</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Median resolution</th>
                  </tr>
                </thead>
                <tbody>
                  {locRows.map((r) => (
                    <tr key={r.uid || r.name} className="border-t border-slate-100">
                      <td className="px-4 py-2.5 text-slate-900 font-medium">{r.name}</td>
                      <td className="px-4 py-2.5 text-right text-slate-700">{r.total}</td>
                      <td className="px-4 py-2.5 text-right text-slate-700">{r.resolved}</td>
                      <td className="px-4 py-2.5 text-right text-slate-700">{fmtDuration(r.medianMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Resolution time is measured from when a report is logged to when it is marked resolved. Median is shown so a single slow job does not skew the figure.
          </p>
        </>
      )}
    </div>
  );
}
