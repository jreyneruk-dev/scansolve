import { requireAuth, getOrgForUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LabelsClient } from "@/components/labels/LabelsClient";
import { getOrgLimits } from "@/lib/plans";
import type { Organization } from "@/types/schema";
import { Printer } from "lucide-react";

export default async function LabelsPage() {
  const user = await requireAuth("/dashboard/labels");
  const org = await getOrgForUser(user.id);

  if (!org) redirect("/onboarding");

  const orgNumber = (org as Record<string, unknown>).org_number as number;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { allowedSheetTypes } = getOrgLimits(org as unknown as Organization);

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
          <Printer className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">QR Labels</h1>
          <p className="text-sm text-slate-500">
            Print Avery label sheets with pre-assigned QR codes for your locations.
          </p>
        </div>
      </div>

      <LabelsClient orgNumber={orgNumber} appUrl={appUrl} allowedSheetTypes={allowedSheetTypes} />
    </div>
  );
}
