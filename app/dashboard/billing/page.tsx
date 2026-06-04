import { requireAuth, getOrgForUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getEffectivePlan } from "@/lib/plans";
import type { Organization } from "@/types/schema";
import { BillingClient } from "@/components/dashboard/BillingClient";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; cancelled?: string }>;
}) {
  const user = await requireAuth("/dashboard/billing");
  const org = await getOrgForUser(user.id);
  if (!org) redirect("/onboarding");

  const params = await searchParams;
  const plan = getEffectivePlan(org as unknown as Organization);
  const orgRecord = org as unknown as Organization & {
    stripe_subscription_id?: string | null;
  };

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Billing</h1>
        <p className="text-xs text-slate-400 mt-0.5">Manage your ScanSolve subscription</p>
      </div>

      <BillingClient
        currentPlan={plan}
        justUpgraded={params.success === "1"}
        justCancelled={params.cancelled === "1"}
        stripeSubscriptionId={orgRecord.stripe_subscription_id ?? null}
      />
    </div>
  );
}
