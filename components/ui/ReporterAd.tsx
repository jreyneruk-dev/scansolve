"use client";

/**
 * ReporterAd — revenue ad slot for the PUBLIC reporter page only.
 *
 * The AdSense library is loaded site-wide in app/layout.tsx (needed for
 * verification). This component renders an actual ad UNIT, but only once the
 * ad unit's slot id is configured:
 *   NEXT_PUBLIC_ADSENSE_SLOT  (the numeric slot id from the AdSense ad unit)
 *
 * Until that's set (i.e. before AdSense approval / before you've created the
 * unit), it falls back to the StarterAdBanner house-ad, so the slot is never
 * empty. Ad units are deliberately confined to this component so they never
 * appear on the auth-gated dashboard, which AdSense policy does not permit.
 *
 * Gating to the free plan is the caller's responsibility (see scan page).
 */

import { useEffect } from "react";
import { StarterAdBanner } from "@/components/ui/StarterAdBanner";

// Must match ADSENSE_CLIENT in app/layout.tsx.
const ADSENSE_CLIENT = "ca-pub-7948132881222311";
const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function ReporterAd() {
  const enabled = Boolean(ADSENSE_SLOT);

  useEffect(() => {
    if (!enabled) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not ready / blocked — silently keep the slot empty.
    }
  }, [enabled]);

  if (!enabled) {
    return <StarterAdBanner variant="scan" />;
  }

  return (
    <div className="mt-6">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      <p className="mt-1 text-center text-[10px] uppercase tracking-wide text-slate-300">
        Advertisement
      </p>
    </div>
  );
}
