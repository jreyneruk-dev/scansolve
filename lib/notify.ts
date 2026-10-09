import { getServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/rate-limit";
import { getEffectivePlan, getPlanLimits } from "@/lib/plans";
import { sendPush } from "@/lib/push";
import { sendNativePush } from "@/lib/fcm";
import type { Organization } from "@/types/schema";

/**
 * Best-effort Prime alert for a new issue, to browser push subscriptions and
 * store-app devices. Never throws, never blocks the caller. Gated on Prime,
 * capped per org per day, and prunes dead subscriptions/tokens.
 */
export async function notifyOrgOfNewIssue(orgId: string, where: string, category: string, issueId?: string) {
  try {
    const db = getServiceClient();
    // Independent reads in one round trip; the cap is only charged if there's someone to alert.
    const [{ data: org }, { data: subs }, { data: devices }] = await Promise.all([
      db.from("organizations").select("plan, plan_expires_at").eq("id", orgId).single(),
      db.from("push_subscriptions").select("endpoint, p256dh, auth").eq("org_id", orgId),
      db.from("native_push_tokens").select("token").eq("org_id", orgId),
    ]);
    if (!org || !getPlanLimits(getEffectivePlan(org as unknown as Organization)).hasSmsWhatsApp) return;
    if (!subs?.length && !devices?.length) return;

    // Per-org daily cap (counts alert *events*, not per-device fan-out).
    const cap = await checkRateLimit(`push_notify:org:${orgId}`, 200, 86400);
    if (!cap.allowed) {
      console.warn(`[notify] push cap reached for org ${orgId}`);
      return;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scansolve.co";
    const path = issueId ? `/dashboard/issues/${issueId}` : "/dashboard";
    const title = "New issue reported";
    const body = `${category} at ${where}`;

    const webSubs = subs ?? [];
    const nativeDevices = devices ?? [];
    const [webResults, nativeResults] = await Promise.all([
      Promise.all(webSubs.map((s) => sendPush(s, { title, body, url: `${appUrl}${path}` }))),
      Promise.all(nativeDevices.map((d) => sendNativePush(d.token, { title, body, path }))),
    ]);

    const deadWeb = webSubs.filter((_, i) => webResults[i].gone).map((s) => s.endpoint);
    const deadNative = nativeDevices.filter((_, i) => nativeResults[i].gone).map((d) => d.token);
    if (deadWeb.length) await db.from("push_subscriptions").delete().in("endpoint", deadWeb);
    if (deadNative.length) await db.from("native_push_tokens").delete().in("token", deadNative);
  } catch (err) {
    console.error("[notify] push failed:", err instanceof Error ? err.message : "unknown");
  }
}
