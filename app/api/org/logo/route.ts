import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uploadOrgLogo } from "@/lib/storage";
import { getOrgForUser } from "@/lib/auth";
import { getOrgLimits } from "@/lib/plans";
import { checkRateLimit } from "@/lib/rate-limit";
import { ALLOWED_IMAGE_TYPES, verifyMagicBytes } from "@/lib/sanitize";
import type { Organization } from "@/types/schema";

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2 MB

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Rate limit: 10 logo uploads per user per hour ──────────────────────────
  const rl = await checkRateLimit(`logo:user:${user.id}`, 10, 3600);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many uploads. Please wait." }, { status: 429 });
  }

  // ── Plan gate ────────────────────────────────────────────────────────────
  const org = await getOrgForUser(user.id);
  if (!org) return NextResponse.json({ error: "No organization found" }, { status: 403 });

  const limits = getOrgLimits(org as unknown as Organization);
  if (!limits.hasOwnLogo) {
    return NextResponse.json(
      { error: "Logo upload requires a Prime or Enterprise plan.", code: "PLAN_REQUIRED" },
      { status: 403 }
    );
  }

  // ── Parse file ───────────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
  if (file.size > MAX_LOGO_SIZE) {
    return NextResponse.json({ error: "Logo must be under 2 MB." }, { status: 413 });
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, and WebP logos are accepted." }, { status: 415 });
  }

  // ── Magic-byte check ─────────────────────────────────────────────────────
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!verifyMagicBytes(buffer, file.type)) {
    return NextResponse.json({ error: "File content does not match its type." }, { status: 415 });
  }

  // ── Upload ───────────────────────────────────────────────────────────────
  const orgId = String((org as Record<string, unknown>).id);
  let logoUrl: string;
  try {
    logoUrl = await uploadOrgLogo(orgId, file);
  } catch (err) {
    console.error("[logo] upload failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }

  // ── Save URL to org ──────────────────────────────────────────────────────
  const { error: dbError } = await getServiceClient()
    .from("organizations")
    .update({ logo_url: logoUrl })
    .eq("id", orgId);

  if (dbError) {
    console.error("[logo] db update failed:", dbError.message);
    return NextResponse.json({ error: "Failed to save logo." }, { status: 500 });
  }

  return NextResponse.json({ logo_url: logoUrl });
}

export async function DELETE(_req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrgForUser(user.id);
  if (!org) return NextResponse.json({ error: "No organization found" }, { status: 403 });

  const orgId = String((org as Record<string, unknown>).id);
  const { error } = await getServiceClient()
    .from("organizations")
    .update({ logo_url: null })
    .eq("id", orgId);

  if (error) return NextResponse.json({ error: "Failed to remove logo." }, { status: 500 });
  return NextResponse.json({ success: true });
}
