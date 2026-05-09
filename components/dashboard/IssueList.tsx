"use client";
import Link from "next/link";
import type { Issue } from "@/types/schema";
import { formatStatus } from "@/lib/utils";
import { ClientDate } from "@/components/ui/ClientDate";
import { MapPin, ChevronRight, Clock, AlertCircle, CheckCircle2, UserCheck, Wrench } from "lucide-react";

const STATUS_CONFIG = {
  reported:    { label: "Reported",    icon: AlertCircle,   pill: "bg-slate-100 text-slate-600",    dot: "bg-slate-400" },
  assigned:    { label: "Assigned",    icon: UserCheck,     pill: "bg-blue-50 text-blue-600",       dot: "bg-blue-400" },
  in_progress: { label: "In Progress", icon: Wrench,        pill: "bg-amber-50 text-amber-600",     dot: "bg-amber-400" },
  resolved:    { label: "Resolved",    icon: CheckCircle2,  pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
} as const;

export function IssueList({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center py-16 rounded-3xl text-center space-y-2">
        <CheckCircle2 className="h-10 w-10 text-slate-200" />
        <p className="text-slate-400 text-sm font-medium">No issues found</p>
        <p className="text-slate-300 text-xs">Issues submitted by reporters will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {issues.map((issue) => {
        const status = (issue.status in STATUS_CONFIG ? issue.status : "reported") as keyof typeof STATUS_CONFIG;
        const { label, icon: Icon, pill, dot } = STATUS_CONFIG[status];
        return (
          <Link
            key={issue.id}
            href={`/dashboard/issues/${issue.id}`}
            className="glass-card flex items-center gap-3 rounded-2xl px-4 py-3.5 hover:border-indigo-200 transition-all group"
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${pill}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-900 truncate">{issue.category}</span>
                <span className="flex items-center gap-1 shrink-0">
                  <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${pill}`}>{label}</span>
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{issue.location?.name ?? "Unknown"}</span>
                <span className="shrink-0">·</span>
                <Clock className="h-3 w-3 shrink-0" />
                <span className="shrink-0"><ClientDate iso={issue.created_at} /></span>
              </div>
              {issue.assigned_to && (
                <p className="text-xs text-indigo-500 mt-0.5 truncate">→ {issue.assigned_to}</p>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 shrink-0 transition-colors" />
          </Link>
        );
      })}
    </div>
  );
}
