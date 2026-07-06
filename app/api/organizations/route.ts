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

const UpdateOrgNameSchema = z.object({
  name: z.string().min(1).max(80),
});

export async function GET(_req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrgForUser(user.id);
  if (!org) return NextResponse.json({ error: "No organization" }, { status: 404 });

  return NextResponse.json({
    id: org.id,
    name: org.name,
    plan: org.plan,
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrgForUser(user.id);
  if (!org) return NextResponse.json({ error: "No organization" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only the org name is editable here. Data backend is Supabase-only now.
  const parsed = UpdateOrgNameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const { error } = await getServiceClient()
    .from("organizations")
    .update({ name: parsed.data.name })
    .eq("id", org.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ name: parsed.data.name });
}
