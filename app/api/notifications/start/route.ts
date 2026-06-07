import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getOptionalUser, getOrgForUser } from "@/lib/auth";
import { getOrgLimits } from "@/lib/plans";
import { checkRateLimit } from "@/lib/rate-limit";
import { startVerification, isValidE164, type NotifyChannel } from "@/lib/sms";
import type { Organization } from "@/types/schema";
import { z } from "zod";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const Schema = z.object({
  phone: z.string().min(8).max(20),
  channel: z.enum(["sms", "whatsapp"]),
});

export async function POST(req: NextRequest) {
  const user = await getOptionalUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrgForUser(user.id);
  if (!org) return NextResponse.json({ error: "No organisation found" }, { status: 404 });

  // Prime gate
  const limits = getOrgLimits(org as unknown as Organization);
  if (!limits.hasSmsWhatsApp) {
    return NextResponse.json(
      { error: "SMS & WhatsApp alerts are a Prime feature.", code: "UPGRADE_REQUIRED" },
      { status: 403 }
    );
  }

  // Rate limit: 5 verification sends per org per hour (Twilio also rate-limits)
  const orgId = (org as Record<string, unknown>).id as string;
  const rl = await checkRateLimit(`notify_verify:org:${orgId}`, 5, 3600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid phone number and channel." }, { status: 422 });
  }

  const phone = parsed.data.phone.replace(/[\s()-]/g, "");
  const channel = parsed.data.channel as NotifyChannel;
  if (!isValidE164(phone)) {
    return NextResponse.json(
      { error: "Use international format, e.g. +447700900123." },
      { status: 422 }
    );
  }

  // Persist the pending destination (unverified) so /verify can read it.
  const db = getServiceClient();
  const { error: upErr } = await db
    .from("organizations")
    .update({ notify_phone: phone, notify_channel: channel, notify_verified: false })
    .eq("id", orgId);
  if (upErr) {
    console.error("[notifications/start] db update failed:", upErr.message);
    return NextResponse.json({ error: "Could not save number. Please try again." }, { status: 500 });
  }

  try {
    await startVerification(phone, channel);
  } catch (err) {
    console.error("[notifications/start] Twilio error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Could not send the code. Check the number and try again." }, { status: 502 });
  }

  return NextResponse.json({ sent: true, channel });
}
