import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { getOrgForUser } from "@/lib/auth";
import { SHEET_TYPES, formatUID } from "@/lib/labels";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const Schema = z.object({
  sheetType: z.enum(["avery_l7169", "avery_l7166", "avery_l7165", "avery_l7164"]),
  sheets: z.number().int().min(1).max(9),
});

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Rate limit: 5 label reservations per user per hour ───────────────────
  const rl = await checkRateLimit(`labels:reserve:user:${user.id}`, 5, 3600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many label reservation requests. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  const org = await getOrgForUser(user.id);
  if (!org) return NextResponse.json({ error: "No organisation found" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { sheetType, sheets } = parsed.data;
  const sheetConfig = SHEET_TYPES[sheetType];
  const totalLabels = sheets * sheetConfig.labelsPerSheet;

  const service = getServiceClient();
  const orgId = (org as Record<string, unknown>).id as string;
  const orgNumber = (org as Record<string, unknown>).org_number as number;

  const { data: reserved, error: rpcError } = await service.rpc("reserve_label_uids", {
    p_org_id: orgId,
    p_count: totalLabels,
  });

  if (rpcError || !reserved || reserved.length === 0) {
    console.error("[labels/reserve] rpc error:", rpcError);
    return NextResponse.json({ error: "Failed to reserve UIDs" }, { status: 500 });
  }

  const { seq_start, seq_end } = reserved[0] as { seq_start: number; seq_end: number };
  const year = new Date().getFullYear();

  const uids: string[] = [];
  for (let i = seq_start; i <= seq_end; i++) {
    uids.push(formatUID(i, year));
  }

  const uidStart = formatUID(seq_start, year);
  const uidEnd = formatUID(seq_end, year);

  const { error: insertError } = await service.from("label_print_jobs").insert({
    org_id: orgId,
    user_id: user.id,
    sheet_type: sheetType,
    sheets,
    quantity_labels: totalLabels,
    uid_start: uidStart,
    uid_end: uidEnd,
  });

  if (insertError) {
    console.error("[labels/reserve] insert error:", insertError);
  }

  return NextResponse.json({
    uids,
    uidStart,
    uidEnd,
    totalLabels,
    sheets,
    sheetType,
    labelsPerSheet: sheetConfig.labelsPerSheet,
    orgNumber,
    year,
  });
}
