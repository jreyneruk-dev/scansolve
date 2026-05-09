import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrgForUser } from "@/lib/auth";
import { getLocationByOrgAndUID, createLocation } from "@/lib/locations";
import { z } from "zod";

const SurveyFieldSchema = z.object({
  enabled: z.boolean(),
  required: z.boolean(),
});

const SurveyConfigSchema = z.object({
  categories: z.array(z.string().min(1).max(50)).min(1).max(20),
  fields: z.object({
    description: SurveyFieldSchema,
    photo: SurveyFieldSchema,
    contact: SurveyFieldSchema,
  }),
  success_message: z.string().min(1).max(200),
});

const CreateLocationSchema = z.object({
  uid: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  floor_plan_url: z.string().url().optional(),
  survey_config: SurveyConfigSchema,
  // org_id passed from commission form (verified against session org below)
  org_id: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgRecord = await getOrgForUser(user.id);
  if (!orgRecord) return NextResponse.json({ error: "Organization not found. Complete onboarding first." }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateLocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // Always use the session org — ignore any org_id from the body that doesn't match
  const orgId = (orgRecord as Record<string, unknown>).id as string;
  const orgNumber = (orgRecord as Record<string, unknown>).org_number as number;

  // Org-scoped duplicate check (UIDs are unique per org, not globally)
  const existing = await getLocationByOrgAndUID(orgNumber, parsed.data.uid);
  if (existing) {
    return NextResponse.json({ error: "This QR code has already been commissioned" }, { status: 409 });
  }

  const location = await createLocation({
    ...parsed.data,
    org_id: orgId,
    claimed_by: user.id,
  });

  return NextResponse.json(location, { status: 201 });
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrgForUser(user.id);
  if (!org) return NextResponse.json([]);

  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("org_id", (org as Record<string, unknown>).id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
