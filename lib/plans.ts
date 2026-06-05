/**
 * lib/plans.ts — single source of truth for plan limits and tier logic.
 *
 * IMPORTANT: never check `org.plan === 'prime'` directly in app code.
 * Always call getEffectivePlan() first — it handles voucher expiry.
 *
 * Usage:
 *   const plan   = getEffectivePlan(org);
 *   const limits = getPlanLimits(plan);
 *   if (!limits.hasOwnLogo) { ... }
 */

import type { Organization } from "@/types/schema";

export type OrgPlan = "free" | "prime" | "enterprise";
// "comp" = complimentary Prime/Enterprise granted manually from the admin tool
// (not a Stripe subscription, not a redeemed voucher).
export type PlanSource = "free" | "paid" | "voucher" | "comp";

export interface PlanLimits {
  /** Max number of invitees (excluding the owner). null = unlimited. */
  maxInvitees: number | null;
  /** Avery sheet type keys allowed for this plan (keys of SHEET_TYPES in lib/labels.ts). */
  allowedSheetTypes: string[];
  /** Show ads on reporter and dashboard pages. */
  hasAds: boolean;
  /** Org can upload their own logo and remove "Powered by ScanSolve". */
  hasOwnLogo: boolean;
  /** SMS or WhatsApp notifications available. */
  hasSmsWhatsApp: boolean;
}

// Avery sheet type keys — must match keys in lib/labels.ts SHEET_TYPES
const AVERY_STARTER: string[] = ["avery_l7165", "avery_l7169"]; // 8-up (default) + 4-up (large)
const AVERY_ALL: string[]     = ["avery_l7164", "avery_l7165", "avery_l7166", "avery_l7169"];

const LIMITS: Record<OrgPlan, PlanLimits> = {
  free: {
    maxInvitees:      2,
    allowedSheetTypes: AVERY_STARTER,
    hasAds:           true,
    hasOwnLogo:       false,
    hasSmsWhatsApp:   false,
  },
  prime: {
    maxInvitees:      20,
    allowedSheetTypes: AVERY_ALL,
    hasAds:           false,
    hasOwnLogo:       true,
    hasSmsWhatsApp:   true,
  },
  enterprise: {
    maxInvitees:      null, // unlimited
    allowedSheetTypes: AVERY_ALL,
    hasAds:           false,
    hasOwnLogo:       true,
    hasSmsWhatsApp:   true,
  },
};

/**
 * Resolves the *effective* plan for an org, accounting for voucher expiry.
 *
 * - Permanent paid/prime:  plan_expires_at IS NULL  → returns 'prime'
 * - Time-limited voucher:  plan_expires_at in future → returns 'prime'
 * - Expired voucher:       plan_expires_at in past   → returns 'free'
 */
export function getEffectivePlan(
  org: Pick<Organization, "plan" | "plan_expires_at">
): OrgPlan {
  const plan = org.plan as OrgPlan;

  if (plan === "free") return "free";
  if (plan === "enterprise") return "enterprise";

  // Prime — check for time-limited access (voucher or lapsed subscription)
  if (org.plan_expires_at && new Date(org.plan_expires_at) < new Date()) {
    return "free";
  }

  return "prime";
}

/**
 * Returns the feature limits for the given effective plan.
 * Always pass the result of getEffectivePlan(), not org.plan directly.
 */
export function getPlanLimits(effectivePlan: OrgPlan): PlanLimits {
  return LIMITS[effectivePlan];
}

/**
 * Convenience: resolve effective plan and return limits in one call.
 */
export function getOrgLimits(
  org: Pick<Organization, "plan" | "plan_expires_at">
): PlanLimits {
  return getPlanLimits(getEffectivePlan(org));
}
