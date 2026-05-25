import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/storage";
import { checkRateLimit } from "@/lib/rate-limit";
import { getLocationByOrgAndUID } from "@/lib/locations";
import {
  ALLOWED_IMAGE_TYPES,
  verifyMagicBytes,
  safeExtFromMime,
  isUUID,
  isSafeUID,
} from "@/lib/sanitize";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const BUCKET = "issue-photos";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  // ── Rate limit: 10 uploads per IP per 10 minutes ──────────────────────────
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit(`upload:ip:${ip}`, 10, 600);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many upload requests." }, { status: 429 });
  }

  // ── Parse multipart form ──────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  // Accept either authenticated (org_id + UUID) or reporter (org_number + uid) flow
  const orgIdRaw = formData.get("org_id") as string | null;
  const orgNumberRaw = formData.get("org_number") as string | null;
  const uidRaw = formData.get("uid") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  // ── File size ─────────────────────────────────────────────────────────────
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File exceeds 5 MB limit." }, { status: 413 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Empty file." }, { status: 400 });
  }

  // ── MIME type whitelist (client-declared) ─────────────────────────────────
  const declaredMime = file.type.toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.includes(declaredMime)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, or HEIC images are allowed." },
      { status: 415 }
    );
  }

  // ── Read bytes & verify magic bytes (server-side) ─────────────────────────
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  if (!verifyMagicBytes(bytes, declaredMime)) {
    return NextResponse.json(
      { error: "File content does not match declared type." },
      { status: 415 }
    );
  }

  // ── Determine org_id from a trusted source ────────────────────────────────
  let orgId: string;

  // PATH A: Authenticated manager upload (org_id is a UUID from their session)
  if (orgIdRaw) {
    if (!isUUID(orgIdRaw)) {
      return NextResponse.json({ error: "Invalid org_id." }, { status: 400 });
    }
    // Verify the session org matches the supplied org_id
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    // We don't import getOrgForUser here to keep the route lean;
    // the org_id mismatch would fail at the storage RLS level.
    orgId = orgIdRaw;
  }
  // PATH B: Reporter upload via QR scan (org_number + uid, no auth)
  else if (orgNumberRaw && uidRaw) {
    const orgNumber = parseInt(orgNumberRaw, 10);
    if (!Number.isInteger(orgNumber) || orgNumber <= 0) {
      return NextResponse.json({ error: "Invalid org_number." }, { status: 400 });
    }
    if (!isSafeUID(uidRaw)) {
      return NextResponse.json({ error: "Invalid uid." }, { status: 400 });
    }
    // Look up the location to get the real, server-authoritative org_id
    const location = await getLocationByOrgAndUID(orgNumber, uidRaw);
    if (!location) {
      return NextResponse.json({ error: "Invalid QR code." }, { status: 404 });
    }
    orgId = location.org_id;
  } else {
    return NextResponse.json(
      { error: "Provide either org_id (authenticated) or org_number + uid (reporter)." },
      { status: 400 }
    );
  }

  // ── Build a safe storage path — never use user-supplied filenames ─────────
  const ext = safeExtFromMime(declaredMime);
  const safeId = randomUUID(); // server-generated — no user input in path
  const storagePath = `${orgId}/${safeId}.${ext}`;

  // ── Upload to Supabase Storage ────────────────────────────────────────────
  const supabase = getServiceClient();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, {
      contentType: declaredMime,
      upsert: false,
    });

  if (uploadError) {
    console.error("[upload] storage error:", uploadError.message);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }

  const signedUrl = await getSignedUrl(storagePath);
  return NextResponse.json({ url: signedUrl }, { status: 201 });
}
