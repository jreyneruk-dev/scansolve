/**
 * lib/push.ts — Web Push (PWA) delivery for Prime issue alerts.
 *
 * Uses the `web-push` library to send VAPID-authenticated, encrypted pushes to
 * a stored subscription. Free: delivery goes through the browser vendors' push
 * services (FCM/APNs/Mozilla), authenticated by self-generated VAPID keys — no
 * third-party account or per-message cost.
 *
 * Required env (server-only except the public key):
 *   VAPID_PUBLIC_KEY  /  NEXT_PUBLIC_VAPID_PUBLIC_KEY  (same value)
 *   VAPID_PRIVATE_KEY
 *   VAPID_SUBJECT     (mailto: or https: contact, e.g. mailto:support@scansolve.co)
 */

import webpush from "web-push";

export interface StoredSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const pub = process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:support@scansolve.co";
  if (!pub || !priv) throw new Error("VAPID keys not configured");
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Send a push to one subscription.
 * Returns { ok } or { ok:false, gone } where `gone` means the subscription is
 * dead (404/410) and the caller should delete it.
 */
export async function sendPush(
  sub: StoredSubscription,
  payload: PushPayload
): Promise<{ ok: boolean; gone: boolean }> {
  ensureConfigured();
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
    return { ok: true, gone: false };
  } catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode;
    const gone = status === 404 || status === 410;
    if (!gone) {
      console.error("[push] send failed:", err instanceof Error ? err.message : "unknown");
    }
    return { ok: false, gone };
  }
}
