import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { getOrgForUser } from "@/lib/auth";
import { z } from "zod";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const Schema = z.object({
  name: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if email has been banned
  const service = getServiceClient();
  const { data: banned } = await service
    .from("banned_emails")
    .select("id")
    .eq("email", (user.email ?? "").toLowerCase())
    .maybeSingle();
  if (banned) return NextResponse.json({ error: "This account has been suspended." }, { status: 403 });

  // Prevent creating a second org
  const existing = await getOrgForUser(user.id);
  if (existing) return NextResponse.json({ error: "Organization already exists" }, { status: 409 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { data: org, error: orgError } = await service
    .from("organizations")
    .insert({ name: parsed.data.name, owner_id: user.id })
    .select()
    .single();

  if (orgError || !org) {
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
  }

  // Add owner to org_members
  await service.from("org_members").insert({
    org_id: org.id,
    user_id: user.id,
    role: "owner",
  });

  return NextResponse.json(org, { status: 201 });
}
