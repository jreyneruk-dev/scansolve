/**
 * lib/fcm.ts — Firebase Cloud Messaging (HTTP v1) for the store apps.
 *
 * ponytail: signs the Google OAuth JWT with node:crypto instead of pulling in
 * firebase-admin; swap to firebase-admin if we ever need topics or batching.
 *
 * Env (server-only): FIREBASE_SERVICE_ACCOUNT — the service-account JSON, as one line.
 */
import { createSign } from "node:crypto";

interface ServiceAccount { project_id: string; client_email: string; private_key: string }

// Promise cache: parallel sends on a cold instance share one OAuth exchange.
let cached: { token: Promise<string>; exp: number } | null = null;

function account(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT not configured");
  return JSON.parse(raw) as ServiceAccount;
}

const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");

function accessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.exp - 60 > now) return cached.token;
  const token = fetchAccessToken(sa, now);
  cached = { token, exp: now + 3500 };
  token.catch(() => { cached = null; });
  return token;
}

async function fetchAccessToken(sa: ServiceAccount, now: number): Promise<string> {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(sa.private_key, "base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
  });
  if (!res.ok) throw new Error(`FCM auth failed: ${res.status}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

/** Returns { gone: true } when FCM says the token is dead and should be deleted. */
export async function sendNativePush(
  deviceToken: string,
  payload: { title: string; body: string; path: string }
): Promise<{ ok: boolean; gone: boolean }> {
  try {
    const sa = account();
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await accessToken(sa)}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          token: deviceToken,
          notification: { title: payload.title, body: payload.body },
          data: { path: payload.path },
          apns: { payload: { aps: { sound: "default" } } },
        },
      }),
    });
    if (res.ok) return { ok: true, gone: false };
    const text = await res.text();
    const gone = res.status === 404 || text.includes("UNREGISTERED");
    if (!gone) console.error("[fcm] send failed:", res.status, text.slice(0, 200));
    return { ok: false, gone };
  } catch (err) {
    console.error("[fcm] send failed:", err instanceof Error ? err.message : "unknown");
    return { ok: false, gone: false };
  }
}
