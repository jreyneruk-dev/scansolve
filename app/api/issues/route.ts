import { NextRequest, NextResponse } from "next/server";
import { getAdapter } from "@/lib/db";
import { getLocationByOrgAndUID } from "@/lib/locations";
import { z } from "zod";

const CreateIssueSchema = z.object({
  uid: z.string().min(1),
  org_number: z.number().int().positive(),
  category: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  photo_url: z.string().url().optional(),
  contact_email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateIssueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { uid, org_number, category, description, photo_url, contact_email } = parsed.data;

  // Org-scoped lookup — UIDs are unique per org, not globally
  const location = await getLocationByOrgAndUID(org_number, uid);

  if (!location) {
    return NextResponse.json({ error: "Invalid QR code" }, { status: 404 });
  }

  if (!location.survey_config.categories.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 422 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const reporter_meta = {
    ua: req.headers.get("user-agent"),
    ip_hash: Buffer.from(ip).toString("base64").slice(0, 12),
    submitted_at: new Date().toISOString(),
  };

  const adapter = await getAdapter(location.org_id);
  await adapter.createIssue({
    uid,
    location_id: location.id,
    org_id: location.org_id,
    category,
    description,
    photo_url,
    contact_email,
    reporter_meta,
  });

  return NextResponse.json(
    { message: location.survey_config.success_message },
    { status: 201 }
  );
}
