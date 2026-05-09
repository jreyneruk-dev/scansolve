import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { getOrgForUser } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { z } from "zod";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const UpdateOrgSchema = z.discriminatedUnion("backend", [
  z.object({ backend: z.literal("supabase") }),
  z.object({
    backend: z.literal("sheets"),
    spreadsheet_id: z.string().min(1),
    service_account_key: z.string().min(1),
  }),
  z.object({
    backend: z.literal("airtable"),
    base_id: z.string().min(1),
    api_key: z.string().min(1),
  }),
]);

export async function GET(_req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrgForUser(user.id);
  if (!org) return NextResponse.json({ error: "No organization" }, { status: 404 });

  // Return org without encrypted credentials
  return NextResponse.json({
    id: org.id,
    name: org.name,
    plan: org.plan,
    backend: (org as Record<string, unknown>).backend ?? "supabase",
    has_credentials: !!(org as Record<string, unknown>).backend_credentials,
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

  const parsed = UpdateOrgSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { backend, ...rest } = parsed.data;
  let backend_credentials: string | null = null;

  if (backend !== "supabase" && Object.keys(rest).length > 0) {
    try {
      backend_credentials = encrypt(JSON.stringify(rest));
    } catch {
      return NextResponse.json({ error: "Failed to encrypt credentials" }, { status: 500 });
    }
  }

  const { error } = await getServiceClient()
    .from("organizations")
    .update({ backend, backend_credentials })
    .eq("id", org.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ backend, has_credentials: !!backend_credentials });
}
