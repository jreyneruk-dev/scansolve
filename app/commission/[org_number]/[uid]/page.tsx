import { requireAuth, getOrgForUser } from "@/lib/auth";
import { getLocationByOrgAndUID } from "@/lib/locations";
import { CommissionForm } from "@/components/dashboard/CommissionForm";
import { ScanSolveLogo } from "@/components/ui/ScanSolveLogo";
import { AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ org_number: string; uid: string }>;
}

export default async function CommissionPage({ params }: PageProps) {
  const { org_number, uid } = await params;
  const orgNum = parseInt(org_number, 10);

  if (isNaN(orgNum)) redirect("/");

  const user = await requireAuth(`/commission/${org_number}/${uid}`);

  let org: Record<string, unknown> | null = null;
  let existing = null;

  try {
    org = (await getOrgForUser(user.id)) as Record<string, unknown> | null;
  } catch (err) {
    console.error("[commission] getOrgForUser failed:", err);
  }

  // Verify the logged-in user belongs to the org whose label this is
  if (!org || org.org_number !== orgNum) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-5 animate-slide-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 border border-red-100 shadow-lg">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <div className="glass-card rounded-3xl p-6 space-y-2">
            <h1 className="text-xl font-bold text-slate-900">Wrong Organisation</h1>
            <p className="text-sm text-slate-500">
              This QR label belongs to organisation <strong className="text-slate-700">#{org_number}</strong>,
              but you are signed in to a different organisation. Please sign in with the correct account.
            </p>
          </div>
          <a href="/dashboard" className="inline-block text-sm text-indigo-600 hover:text-indigo-700 transition-colors">
            Go to Dashboard
          </a>
        </div>
      </main>
    );
  }

  // Check if already commissioned within this org
  try {
    existing = await getLocationByOrgAndUID(orgNum, uid);
  } catch (err) {
    console.error("[commission] getLocationByOrgAndUID failed:", err);
  }

  if (existing) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-5 animate-slide-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 border border-amber-100 shadow-lg">
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
          <div className="glass-card rounded-3xl p-6 space-y-2">
            <h1 className="text-xl font-bold text-slate-900">Already Commissioned</h1>
            <p className="text-sm text-slate-500">
              This QR code is already assigned to{" "}
              <strong className="text-slate-700">{existing.name}</strong>.
            </p>
          </div>
          <a href="/dashboard" className="inline-block text-sm text-indigo-600 hover:text-indigo-700 transition-colors">
            Go to Dashboard
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh">
      <div className="max-w-lg mx-auto">
        <div className="glass-nav sticky top-0 z-10 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <ScanSolveLogo size="sm" showWordmark={false} />
            <div>
              <h1 className="text-base font-bold text-slate-900">Commission QR Code</h1>
              <p className="text-xs text-slate-400">
                UID: <code className="font-mono bg-white/60 px-1 py-0.5 rounded">{uid}</code>
                <span className="ml-2 text-slate-300">·</span>
                <span className="ml-2">Org #{org_number}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <CommissionForm uid={uid} orgId={(org as Record<string, unknown>).id as string} />
        </div>
      </div>
    </main>
  );
}
