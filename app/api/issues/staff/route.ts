import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { getOptionalUser, getOrgForUser } from "@/lib/auth";
import { getAdapter } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeCategory } from "@/lib/sanitize";
import { notifyOrgOfNewIssue } from "@/lib/notify";
import { signedPhotoUrl, storagePathFromSignedUrl } from "@/lib/storage";

// Staff log an issue without a QR label. The org always comes from the
// signed-in session; anything org-like in the body is ignored by the schema.
const Schema = z.object({
  location_text: z.string().trim().min(2).max(200),
  category: z.string().trim().min(1).max(50),
  description: z.string().trim().max(2000).optional(),
  photo_url: signedPhotoUrl.optional(),
});

export async function POST(req: NextRequest) {
  const user = await getOptionalUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = (await getOrgForUser(user.id)) as { id: string } | null;
  if (!org) return NextResponse.json({ error: "No organisation found" }, { status: 404 });

  const rl = await checkRateLimit(`issues:staff:${user.id}`, 30, 3600);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many issues logged. Please wait a little." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Add where the issue is and what kind of issue it is." }, { status: 422 });
  }

  // Photos are stored under the org's own prefix; reject another org's upload.
  if (parsed.data.photo_url && !storagePathFromSignedUrl(parsed.data.photo_url)?.startsWith(`${org.id}/`)) {
    return NextResponse.json({ error: "Invalid photo." }, { status: 422 });
  }

  const category = sanitizeCategory(parsed.data.category);
  const adapter = await getAdapter(org.id);
  const issue = await adapter.createIssue({
    org_id: org.id,
    location_id: null,
    location_text: parsed.data.location_text,
    created_by: user.id,
    category,
    description: parsed.data.description || undefined,
    photo_url: parsed.data.photo_url,
    reporter_meta: { source: "staff", submitted_at: new Date().toISOString() },
  });

  after(() => notifyOrgOfNewIssue(org.id, parsed.data.location_text, category, issue.id));

  return NextResponse.json({ id: issue.id }, { status: 201 });
}
