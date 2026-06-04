/**
 * StarterAdBanner — house-ad upsell shown only on the free (Starter) plan.
 *
 * variant="scan"      → ultra-minimalist strip for the public reporter page
 * variant="dashboard" → more visible card for the manager dashboard
 *
 * Never shown on prime/enterprise plans (caller's responsibility to gate).
 */

import Link from "next/link";
import { QrCode, ArrowRight, Sparkles } from "lucide-react";

interface Props {
  variant: "scan" | "dashboard";
}

export function StarterAdBanner({ variant }: Props) {
  if (variant === "scan") {
    return (
      <div className="mt-6 px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
          <QrCode className="h-3.5 w-3.5 text-white" />
        </div>
        <p className="text-xs text-slate-500 leading-snug flex-1">
          Facility reporting by{" "}
          <Link
            href="https://scansolve.co"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
          >
            ScanSolve
          </Link>
          {" "}·{" "}
          <Link
            href="https://scansolve.co/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            Remove this banner →
          </Link>
        </p>
      </div>
    );
  }

  // dashboard variant — below the issue list
  return (
    <div className="mt-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 px-4 py-3.5 flex items-center gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-indigo-100">
        <Sparkles className="h-4 w-4 text-indigo-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-700">
          Remove ads and add your own logo
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          Upgrade to Prime — no ads on any page, ever.
        </p>
      </div>
      <Link
        href="/pricing"
        className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
      >
        Upgrade
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
