import { requireAuth, getOrgForUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { TeamSettings } from "@/components/dashboard/TeamSettings";
import { OrgNameSettings } from "@/components/dashboard/OrgNameSettings";
import { RecoveryEmailSettings } from "@/components/dashboard/RecoveryEmailSettings";
import { BrandingSettings } from "@/components/dashboard/BrandingSettings";
import { NotificationSettings } from "@/components/dashboard/NotificationSettings";
import { DeleteAccount } from "@/components/dashboard/DeleteAccount";
import { getEffectivePlan } from "@/lib/plans";
import type { Organization } from "@/types/schema";

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

  const recoveryEmail = (user.user_metadata?.recovery_email as string | undefined) ?? null;

  const ownerId = (org as Record<string, unknown>).owner_id as string | null;
  const [{ data: orgData }, { data: members }, { data: invites }] = await Promise.all([
    service.from("organizations").select("logo_url").eq("id", orgId).single(),
    service.from("org_members").select("id, role, created_at, user_id").eq("org_id", orgId),
    service.from("org_invites").select("id, email, accepted_at, expires_at, created_at").eq("org_id", orgId).order("created_at", { ascending: false }),
  ]);

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
        <RecoveryEmailSettings initialRecoveryEmail={recoveryEmail} />
      </div>

      <div className="border-t border-slate-100 pt-6">
        <BrandingSettings
          isPrime={getEffectivePlan(org as unknown as Organization) !== "free"}
          initialLogoUrl={orgData?.logo_url ?? null}
        />
      </div>

      <div className="border-t border-slate-100 pt-6">
        <NotificationSettings
          isPrime={getEffectivePlan(org as unknown as Organization) !== "free"}
        />
      </div>

      <div className="border-t border-slate-100 pt-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Help</h2>
        <p className="text-xs text-slate-500">
          Questions or problems? Email{" "}
          <a href="mailto:support@scansolve.co" className="font-medium text-indigo-600">support@scansolve.co</a>.
        </p>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <DeleteAccount
          isOwner={ownerId === user.id || (members ?? []).some((m) => m.user_id === user.id && m.role === "owner")}
          confirmText={orgName || (user.email ?? "")}
        />
      </div>
    </div>
  );
}
