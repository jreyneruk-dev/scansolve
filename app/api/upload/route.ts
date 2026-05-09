import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@/lib/storage";
import { createClient } from "@supabase/supabase-js";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const BUCKET = "issue-photos";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const orgId = formData.get("org_id") as string | null;
  const issueId = formData.get("issue_id") as string | null;

  if (!file || !orgId || !issueId) {
    return NextResponse.json({ error: "file, org_id, and issue_id required" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File exceeds 5MB limit" }, { status: 413 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, or HEIC images are allowed" }, { status: 415 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${orgId}/${issueId}/${Date.now()}.${ext}`;

  const supabase = getServiceClient();
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const signedUrl = await getSignedUrl(path);
  return NextResponse.json({ url: signedUrl }, { status: 201 });
}
