import { getLocationByOrgAndUID, getOrgPlanByNumber } from "@/lib/locations";
import { getEffectivePlan } from "@/lib/plans";
import { SurveyForm } from "@/components/survey/SurveyForm";
import { ScanSolveLogo } from "@/components/ui/ScanSolveLogo";
import { StarterAdBanner } from "@/components/ui/StarterAdBanner";
import { MapPin, AlertCircle } from "lucide-react";
import Image from "next/image";

interface PageProps {
  params: Promise<{ org_number: string; uid: string }>;
}

export default async function ScanPage({ params }: PageProps) {
  const { org_number, uid } = await params;
  const orgNum = parseInt(org_number, 10);
  const [location, orgPlan] = await Promise.all([
    isNaN(orgNum) ? Promise.resolve(null) : getLocationByOrgAndUID(orgNum, uid),
    isNaN(orgNum) ? Promise.resolve(null) : getOrgPlanByNumber(orgNum),
  ]);

  const effectivePlan = orgPlan ? getEffectivePlan(orgPlan) : "free";
  const showAd     = effectivePlan === "free";
  const isPaid     = effectivePlan !== "free";
  const orgLogoUrl = isPaid ? (orgPlan?.logo_url ?? null) : null;

  if (!location) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-5 animate-slide-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 border border-amber-100 shadow-lg">
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">QR Code Not Activated</h1>
            <p className="mt-1 text-sm text-slate-500">
              This QR code hasn&apos;t been set up yet.
            </p>
          </div>
          <a
            href={`/commission/${org_number}/${uid}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Activate this QR code
          </a>
          <div className="pt-2">
            <ScanSolveLogo size="sm" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="glass-nav sticky top-0 z-10 px-4 py-3">
          <div className="flex items-center gap-2.5">
            {orgLogoUrl ? (
              <Image
                src={orgLogoUrl}
                alt="Logo"
                width={32}
                height={32}
                className="h-8 w-8 rounded-xl object-contain shrink-0"
                unoptimized
              />
            ) : (
              <ScanSolveLogo size="sm" showWordmark={false} />
            )}
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-sm font-semibold text-slate-700 truncate">{location.name}</span>
            </div>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5">Report an Issue</h1>
        </div>

        <div className="p-4 pb-8">
          <SurveyForm
            locationUid={uid}
            orgNumber={orgNum}
            surveyConfig={location.survey_config}
          />
          {showAd && <StarterAdBanner variant="scan" />}
        </div>
      </div>
    </main>
  );
}
