"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Issue, IssueStatus } from "@/types/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatStatus } from "@/lib/utils";
import { ClientDate } from "@/components/ui/ClientDate";
import { ArrowLeft, MapPin, Mail, Loader2, CheckCircle2, Clock, UserCheck } from "lucide-react";
import Link from "next/link";

const VALID_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  reported:    ["assigned"],
  assigned:    ["in_progress", "resolved", "reported"],
  in_progress: ["resolved", "assigned"],
  resolved:    ["assigned"],
};

const STATUS_PILLS: Record<string, string> = {
  reported:    "bg-slate-100 text-slate-600",
  assigned:    "bg-blue-50 text-blue-600",
  in_progress: "bg-amber-50 text-amber-600",
  resolved:    "bg-emerald-50 text-emerald-700",
};

export function IssueDetail({ issue }: { issue: Issue }) {
  const router = useRouter();
  const [status, setStatus] = useState<IssueStatus>(issue.status as IssueStatus);
  const [assignedTo, setAssignedTo] = useState(issue.assigned_to ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const allowedTransitions = VALID_TRANSITIONS[status] ?? [];

  async function handleSave() {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      if (assignedTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(assignedTo)) {
        setError("Please enter a valid email address for the assignee");
        setLoading(false);
        return;
      }
      const body: Record<string, string> = { status };
      if (assignedTo) body.assigned_to = assignedTo;
      const res = await fetch(`/api/issues/${issue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Update failed");
      }
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 max-w-lg mx-auto">

      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-xl glass-card text-slate-500 hover:text-indigo-600 transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-slate-900 truncate">{issue.category}</h1>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{issue.location?.name ?? "Unknown location"}</span>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_PILLS[issue.status] ?? "bg-slate-100 text-slate-600"}`}>
          {formatStatus(issue.status)}
        </span>
      </div>

      {/* Issue details */}
      <div className="glass-card rounded-2xl divide-y divide-white/40 overflow-hidden">
        <Row label="Reported" icon={<Clock className="h-3.5 w-3.5" />} value={<ClientDate iso={issue.created_at} />} />
        {issue.description && (
          <Row label="Description" value={issue.description} />
        )}
        {issue.contact_email && (
          <Row
            label="Reporter"
            icon={<Mail className="h-3.5 w-3.5" />}
            value={
              <a href={`mailto:${issue.contact_email}`} className="text-indigo-600 hover:underline">
                {issue.contact_email}
              </a>
            }
          />
        )}
        {issue.assigned_to && (
          <Row
            label="Assigned to"
            icon={<UserCheck className="h-3.5 w-3.5" />}
            value={issue.assigned_to}
          />
        )}
      </div>

      {/* Photo */}
      {issue.photo_url && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <a href={issue.photo_url} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={issue.photo_url} alt="Issue photo" className="w-full max-h-64 object-cover" />
          </a>
        </div>
      )}

      {/* Manage */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-slate-900">Manage Issue</h2>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as IssueStatus)}>
            <SelectTrigger className="h-11 glass-input rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={status}>{formatStatus(status)}</SelectItem>
              {allowedTransitions.filter((s) => s !== status).map((s) => (
                <SelectItem key={s} value={s}>{formatStatus(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="assignee" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Assign to
          </Label>
          <Input
            id="assignee"
            type="text"
            inputMode="email"
            placeholder="employee@company.com"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="h-11 glass-input rounded-xl"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50/80 rounded-xl px-3 py-2">{error}</p>
        )}
        {saved && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50/80 rounded-xl px-4 py-3">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Saved successfully
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center justify-center w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
        </button>
      </div>

      {/* Timeline */}
      {(issue.assigned_at || issue.resolved_at) && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-slate-900">Timeline</h2>
          <Row label="Reported" icon={<Clock className="h-3.5 w-3.5" />} value={<ClientDate iso={issue.created_at} />} />
          {issue.assigned_at && issue.assigned_to && (
            <Row label="Assigned" icon={<UserCheck className="h-3.5 w-3.5" />} value={<>{issue.assigned_to} · <ClientDate iso={issue.assigned_at} /></>} />
          )}
          {issue.resolved_at && (
            <Row label="Resolved" icon={<CheckCircle2 className="h-3.5 w-3.5" />} value={<ClientDate iso={issue.resolved_at} />} />
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex gap-3 px-5 py-3">
      <div className="flex items-center gap-1 w-24 shrink-0 text-xs font-semibold text-slate-400 uppercase tracking-wide pt-0.5">
        {icon}
        {label}
      </div>
      <span className="text-sm text-slate-700 flex-1">{value}</span>
    </div>
  );
}
