import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getOptionalUser, getOrgForUser } from "@/lib/auth";
import { getOrgLimits } from "@/lib/plans";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkVerification } from "@/lib/sms";
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
  code: z.string().min(4).max(10).regex(/^\d+$/, "code must be numeric"),
});

export async function POST(req: NextRequest) {
  const user = await getOptionalUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrgForUser(user.id);
  if (!org) return NextResponse.json({ error: "No organisation found" }, { status: 404 });

  const limits = getOrgLimits(org as unknown as Organization);
  if (!limits.hasSmsWhatsApp) {
    return NextResponse.json(
      { error: "SMS & WhatsApp alerts are a Prime feature.", code: "UPGRADE_REQUIRED" },
      { status: 403 }
    );
  }

  const orgId = (org as Record<string, unknown>).id as string;
  // Rate limit code-check attempts to thwart brute force (Twilio also caps).
  const rl = await checkRateLimit(`notify_check:org:${orgId}`, 10, 3600);
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
    return NextResponse.json({ error: "Enter the numeric code." }, { status: 422 });
  }

  const db = getServiceClient();
  // Read the pending destination saved by /start — the phone is server-side,
  // never trusted from the client at verify time.
  const { data: orgRow } = await db
    .from("organizations")
    .select("notify_phone, notify_channel")
    .eq("id", orgId)
    .single();

  const phone = orgRow?.notify_phone;
  if (!phone) {
    return NextResponse.json({ error: "No pending number. Start again." }, { status: 409 });
  }

  let approved = false;
  try {
    approved = await checkVerification(phone, parsed.data.code);
  } catch (err) {
    console.error("[notifications/verify] Twilio error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Could not verify the code. Please try again." }, { status: 502 });
  }

  if (!approved) {
    return NextResponse.json({ error: "Incorrect or expired code." }, { status: 400 });
  }

  const { error: upErr } = await db
    .from("organizations")
    .update({ notify_verified: true })
    .eq("id", orgId);
  if (upErr) {
    console.error("[notifications/verify] db update failed:", upErr.message);
    return NextResponse.json({ error: "Verified, but could not save. Try again." }, { status: 500 });
  }

  return NextResponse.json({ verified: true, phone, channel: orgRow?.notify_channel });
}
