import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, getOrgForUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  // Auth
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit
  const rateLimit = await checkRateLimit(`voucher_redeem:${user.id}`, 5, 3600);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many attempts — try again later" }, { status: 429 });
  }

  const org = await getOrgForUser(user.id);
  if (!org) return NextResponse.json({ error: "No organisation found" }, { status: 404 });

  const { code } = await req.json() as { code?: string };
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const db = getServiceClient();
  const orgId = (org as Record<string, unknown>).id as string;

  // Look up the voucher
  const { data: voucher, error: vErr } = await db
    .from("vouchers")
    .select("id, tier, duration, max_uses, use_count, expires_at")
    .eq("code", code.trim().toUpperCase())
    .single();

  if (vErr || !voucher) {
    return NextResponse.json({ error: "Voucher code not found" }, { status: 404 });
  }

  // Check voucher itself hasn't expired
  if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
    return NextResponse.json({ error: "This voucher has expired" }, { status: 410 });
  }

  // Check usage cap
  if (voucher.use_count >= voucher.max_uses) {
    return NextResponse.json({ error: "This voucher has already been used" }, { status: 410 });
  }

  // Check this org hasn't already redeemed it
  const { data: existing } = await db
    .from("voucher_redemptions")
    .select("id")
    .eq("voucher_id", voucher.id)
    .eq("org_id", orgId)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Your organisation has already redeemed this code" }, { status: 409 });
  }

  // Compute plan_expires_at
  let planExpiresAt: string | null = null;
  if (voucher.duration === "1year") {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    planExpiresAt = d.toISOString();
  } else if (voucher.duration === "1month") {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    planExpiresAt = d.toISOString();
  }
  // lifetime → planExpiresAt stays null

  // Apply plan upgrade + record redemption atomically
  const [orgUpdate, redemptionInsert, voucherIncrement] = await Promise.all([
    db
      .from("organizations")
      .update({ plan: "prime", plan_source: "voucher", plan_expires_at: planExpiresAt })
      .eq("id", orgId),
    db
      .from("voucher_redemptions")
      .insert({ voucher_id: voucher.id, org_id: orgId }),
    db
      .from("vouchers")
      .update({ use_count: voucher.use_count + 1 })
      .eq("id", voucher.id),
  ]);

  if (orgUpdate.error || redemptionInsert.error || voucherIncrement.error) {
    console.error("[vouchers/redeem] DB error", { orgUpdate, redemptionInsert, voucherIncrement });
    return NextResponse.json({ error: "Failed to apply voucher — please try again" }, { status: 500 });
  }

  const message =
    voucher.duration === "lifetime"
      ? "Prime activated — yours forever!"
      : voucher.duration === "1year"
      ? "Prime activated for 1 year!"
      : "Prime activated for 1 month!";

  return NextResponse.json({ success: true, message });
}
