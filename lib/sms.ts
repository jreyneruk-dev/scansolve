/**
 * lib/sms.ts — Twilio SMS/WhatsApp for Prime issue alerts.
 *
 * Uses the Twilio REST API directly via fetch (no SDK dependency, per the
 * project's "minimize external libraries" rule):
 *  - Verify API   → phone-ownership OTP (start + check), channel sms|whatsapp
 *  - Messaging API → the actual issue-alert message
 *
 * All functions THROW on failure so callers can decide whether to surface or
 * swallow the error (issue alerts swallow; verification surfaces).
 *
 * Required env (server-only):
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID,
 *   TWILIO_SMS_FROM            (e.g. +14155551234)
 *   TWILIO_WHATSAPP_FROM       (e.g. +14155551234 — the WhatsApp sender, no prefix)
 */

export type NotifyChannel = "sms" | "whatsapp";

const VERIFY_BASE = "https://verify.twilio.com/v2";
const API_BASE = "https://api.twilio.com/2010-04-01";

/** Strict E.164: leading +, country digit 1-9, total 8–15 digits. */
export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

function creds() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error("Twilio credentials not configured");
  return { sid, token, auth: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64") };
}

function verifyServiceSid() {
  const s = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!s) throw new Error("TWILIO_VERIFY_SERVICE_SID not configured");
  return s;
}

async function twilioPost(url: string, auth: string, form: Record<string, string>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(form).toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Twilio returns { message, code } on error — log the code, never the phone.
    throw new Error(`Twilio ${res.status}: ${data?.message ?? "request failed"}`);
  }
  return data;
}

/** Start phone verification. Sends an OTP to `phone` over the chosen channel. */
export async function startVerification(phone: string, channel: NotifyChannel) {
  if (!isValidE164(phone)) throw new Error("Invalid phone number");
  const { auth } = creds();
  await twilioPost(`${VERIFY_BASE}/Services/${verifyServiceSid()}/Verifications`, auth, {
    To: phone,
    Channel: channel,
  });
}

/** Check an OTP. Returns true only if Twilio reports status "approved". */
export async function checkVerification(phone: string, code: string): Promise<boolean> {
  if (!isValidE164(phone)) throw new Error("Invalid phone number");
  const { auth } = creds();
  const data = await twilioPost(
    `${VERIFY_BASE}/Services/${verifyServiceSid()}/VerificationCheck`,
    auth,
    { To: phone, Code: code }
  );
  return data?.status === "approved";
}

/**
 * Send an issue alert to a verified number.
 * NOTE: WhatsApp business-initiated messages outside the 24h customer window
 * may require an approved template; freeform sends can be rejected by Twilio.
 */
export async function sendIssueAlert(params: {
  to: string;
  channel: NotifyChannel;
  body: string;
}) {
  const { to, channel, body } = params;
  if (!isValidE164(to)) throw new Error("Invalid phone number");
  const { sid, auth } = creds();

  const from =
    channel === "whatsapp"
      ? process.env.TWILIO_WHATSAPP_FROM
      : process.env.TWILIO_SMS_FROM;
  if (!from) throw new Error(`Twilio ${channel} sender not configured`);

  const To = channel === "whatsapp" ? `whatsapp:${to}` : to;
  const From = channel === "whatsapp" ? `whatsapp:${from}` : from;

  await twilioPost(`${API_BASE}/Accounts/${sid}/Messages.json`, auth, {
    To,
    From,
    Body: body,
  });
}
