import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdapter } from "@/lib/db";
import { getLocationByOrgAndUID } from "@/lib/locations";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeCategory } from "@/lib/sanitize";
import { getEffectivePlan, getPlanLimits } from "@/lib/plans";
import { sendIssueAlert, type NotifyChannel } from "@/lib/sms";
import type { Organization } from "@/types/schema";
import { z } from "zod";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://scansolve.co";

/**
 * Fire a Prime SMS/WhatsApp alert for a new issue. Best-effort: never throws,
 * never blocks issue creation. Gated on Prime + a verified destination number,
 * and capped per org per day to bound cost/abuse.
 */
async function notifyOrgOfNewIssue(orgId: string, locationName: string, category: string) {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const { data: org } = await db
      .from("organizations")
      .select("plan, plan_expires_at, notify_phone, notify_channel, notify_verified")
      .eq("id", orgId)
      .single();
    if (!org) return;

    if (!org.notify_verified || !org.notify_phone || !org.notify_channel) return;
    if (!getPlanLimits(getEffectivePlan(org as unknown as Organization)).hasSmsWhatsApp) return;

    // Per-org daily cap on outbound alerts (cost + abuse bound).
    const cap = await checkRateLimit(`sms_notify:org:${orgId}`, 50, 86400);
    if (!cap.allowed) {
      console.warn(`[issues] SMS alert cap reached for org ${orgId}`);
      return;
    }

    const body = `ScanSolve: new "${category}" issue reported at ${locationName}. View: ${APP_URL}/dashboard`;
    await sendIssueAlert({
      to: org.notify_phone,
      channel: org.notify_channel as NotifyChannel,
      body,
    });
  } catch (err) {
    console.error("[issues] alert send failed:", err instanceof Error ? err.message : "unknown");
  }
}

const CreateIssueSchema = z.object({
  uid: z.string().min(1).max(30).regex(/^\d+$/, "uid must be numeric"),
  org_number: z.number().int().positive(),
  category: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  // photo_url must be a Supabase signed URL — reject arbitrary URLs
  photo_url: z
    .string()
    .url()
    .refine(
      (url) => {
        try {
          const { hostname, pathname } = new URL(url);
          return (
            hostname.endsWith(".supabase.co") &&
            pathname.startsWith("/storage/v1/object/sign/")
          );
        } catch {
          return false;
        }
      },
      { message: "photo_url must be a Supabase signed storage URL" }
    )
    .optional(),
  contact_email: z.string().email().max(254).optional(),
});

export async function POST(req: NextRequest) {
  // ── Rate limit by IP: 10 submissions per 60 seconds ──────────────────────
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const ipRl = await checkRateLimit(`issues:ip:${ip}`, 10, 60);
  if (!ipRl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before submitting again." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateIssueSchema.safeParse(body);
  if (!parsed.success) {
    // Return generic error — don't leak field names in production
    return NextResponse.json({ error: "Invalid submission." }, { status: 422 });
  }

  const { uid, org_number, category, description, photo_url, contact_email } = parsed.data;

  // ── Rate limit per UID: 20 submissions per hour (prevents targeted spam) ──
  const uidRl = await checkRateLimit(`issues:uid:${org_number}:${uid}`, 20, 3600);
  if (!uidRl.allowed) {
    return NextResponse.json(
      { error: "Too many reports for this location. Please try again later." },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  // ── Org-scoped location lookup — UIDs are unique per org ─────────────────
  const location = await getLocationByOrgAndUID(org_number, uid);
  if (!location) {
    // Generic error — don't reveal whether the UID exists
    return NextResponse.json({ error: "Invalid QR code." }, { status: 404 });
  }

  // ── Validate category against the location's allowed list ─────────────────
  const normalizedCategory = sanitizeCategory(category);
  if (!location.survey_config.categories.includes(normalizedCategory)) {
    return NextResponse.json({ error: "Invalid category." }, { status: 422 });
  }

  // ── Build reporter metadata (no PII stored) ───────────────────────────────
  const reporter_meta = {
    // Store a short irreversible hash of the IP — not the IP itself
    ip_hash: Buffer.from(ip).toString("base64").slice(0, 12),
    submitted_at: new Date().toISOString(),
    // Truncate UA to avoid storing fingerprinting data
    ua: (req.headers.get("user-agent") ?? "").slice(0, 120),
  };

  const adapter = await getAdapter(location.org_id);
  await adapter.createIssue({
    uid,
    location_id: location.id,
    org_id: location.org_id,
    category: normalizedCategory,
    // Trim description — strip leading/trailing whitespace
    description: description?.trim(),
    photo_url,
    contact_email: contact_email?.toLowerCase().trim(),
    reporter_meta,
  });

  // Best-effort Prime SMS/WhatsApp alert — never blocks the reporter response.
  await notifyOrgOfNewIssue(location.org_id, location.name, normalizedCategory);

  return NextResponse.json(
    { message: location.survey_config.success_message },
    { status: 201 }
  );
}
