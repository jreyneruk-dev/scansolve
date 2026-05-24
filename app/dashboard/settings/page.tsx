import { requireAuth, getOrgForUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { BackendSettings } from "@/components/dashboard/BackendSettings";
import { TeamSettings } from "@/components/dashboard/TeamSettings";
import { OrgNameSettings } from "@/components/dashboard/OrgNameSettings";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export default async function SettingsPage() {
  const user = await requireAuth("/dashboard/settings");
  const org = await getOrgForUser(user.id);

  if (!org) redirect("/onboarding");

  const orgId = String((org as Record<string, unknown>).id);
  const orgName = String((org as Record<string, unknown>).name ?? "");
  const service = getServiceClient();

  const [{ data: orgData }, { data: members }, { data: invites }] = await Promise.all([
    service.from("organizations").select("backend, backend_credentials").eq("id", orgId).single(),
    service.from("org_members").select("id, role, created_at, user_id").eq("org_id", orgId),
    service.from("org_invites").select("id, email, accepted_at, expires_at, created_at").eq("org_id", orgId).order("created_at", { ascending: false }),
  ]);

  const backendInitial = {
    backend: (orgData?.backend ?? "supabase") as "supabase" | "sheets" | "airtable",
    has_credentials: !!orgData?.backend_credentials,
  };

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5">{orgName}</p>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <OrgNameSettings initialName={orgName} />
      </div>

      <div className="border-t border-slate-100 pt-6">
        <TeamSettings
          members={members ?? []}
          invites={invites ?? []}
          currentUserId={user.id}
        />
      </div>

      <div className="border-t border-slate-100 pt-6">
        <BackendSettings initial={backendInitial} />
      </div>
    </div>
  );
}
