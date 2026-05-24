import { requireAuth, getOrgForUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OrgSetupForm } from "@/components/onboarding/OrgSetupForm";
import { QrCode } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export default async function OnboardingPage() {
  const user = await requireAuth("/onboarding");

  // Skip onboarding if org already exists
  const org = await getOrgForUser(user.id);
  if (org) redirect("/dashboard");

  // If the user has a pending invite, send them there instead of creating a new org
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

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-5 animate-slide-in">
        <div className="text-center space-y-3">
          <div className="relative mx-auto w-fit">
            <div className="absolute inset-0 rounded-3xl bg-indigo-500 blur-xl opacity-35 animate-pulse-glow" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/30">
              <QrCode className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Set up your organization</h1>
            <p className="mt-1 text-sm text-slate-500">
              You&apos;re the first from your team. Give your organization a name to get started.
            </p>
          </div>
        </div>
        <OrgSetupForm />
      </div>
    </main>
  );
}
