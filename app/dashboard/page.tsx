import { requireAuth, getOrgForUser } from "@/lib/auth";
import { getAdapter } from "@/lib/db";
import { redirect } from "next/navigation";
import { IssueList } from "@/components/dashboard/IssueList";
import { CheckCircle2 } from "lucide-react";
import type { IssueStatus } from "@/types/schema";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

interface PageProps {
  searchParams: Promise<{ status?: string; commissioned?: string }>;
}

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "reported", label: "Reported" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

export default async function DashboardPage({ searchParams }: PageProps) {
  const { status, commissioned } = await searchParams;
  const user = await requireAuth("/dashboard");
  const org = await getOrgForUser(user.id);

  if (!org) {
    // Before sending to onboarding (which creates a new org), check for a
    // pending invite for this user's email. If one exists, send them to accept it.
    if (user.email) {
      const service = getServiceClient();
      const { data: invite } = await service
        .from("org_invites")
        .select("token")
        .eq("email", user.email.toLowerCase())
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (invite?.token) {
        redirect(`/invite/${invite.token}`);
      }
    }
    redirect("/onboarding");
  }

  const adapter = await getAdapter(org.id);
  const issues = await adapter.getIssuesByOrg(org.id, {
    status: status as IssueStatus | undefined,
    limit: 50,
  });

  const unresolvedCount = issues.filter((i) => i.status !== "resolved").length;

  return (
    <div className="space-y-5">
      {commissioned && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50/80 border border-emerald-100 px-4 py-3 text-sm text-emerald-800 animate-slide-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          QR code activated! Reporters can now scan it to submit issues.
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Issues</h1>
          <p className="text-xs text-slate-400 mt-0.5">{org.name}</p>
        </div>
        {unresolvedCount > 0 && (
          <span className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20">
            {unresolvedCount} open
          </span>
        )}
      </div>

      {/* Status filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {STATUS_FILTERS.map(({ value, label }) => (
          <a
            key={value}
            href={value ? `?status=${value}` : "/dashboard"}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 min-h-[32px] flex items-center ${
              (status ?? "") === value
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20"
                : "glass-card text-slate-600 hover:text-indigo-600"
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      <IssueList issues={issues} />
    </div>
  );
}
