import { timingSafeEqual, createHash } from "node:crypto";

/**
 * App Store / Play review account. Reviewers can't read our inbox, so one
 * pre-agreed email signs in with a fixed code instead of an emailed one.
 * Off unless all three env vars are set; confined to the demo organisation.
 *
 *   REVIEW_EMAIL     e.g. appreview@scansolve.co
 *   REVIEW_CODE      exactly 8 digits (fits the sign-in code box), shared only in the review notes
 *   REVIEW_ORG_ID    the seeded "ScanSolve Demo" organisation id
 */
export function reviewConfig() {
  const email = process.env.REVIEW_EMAIL?.trim().toLowerCase();
  const code = process.env.REVIEW_CODE?.trim();
  const orgId = process.env.REVIEW_ORG_ID?.trim();
  if (!email || !code || !/^\d{8}$/.test(code) || !orgId) return null;
  return { email, code, orgId };
}

export function isReviewEmail(email: string): boolean {
  const cfg = reviewConfig();
  return !!cfg && email.trim().toLowerCase() === cfg.email;
}

/** Constant-time compare (hash first so lengths always match). */
export function codesMatch(given: string, expected: string): boolean {
  const hash = (s: string) => createHash("sha256").update(s.trim()).digest();
  return timingSafeEqual(hash(given), hash(expected));
}
