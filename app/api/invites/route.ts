import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { getOrgForUser } from "@/lib/auth";
import { sendInviteEmail } from "@/lib/email";
import { z } from "zod";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const InviteSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrgForUser(user.id);
  if (!org) return NextResponse.json({ error: "No organization found" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = InviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { email } = parsed.data;
  const service = getServiceClient();

  // Check for existing active invite
  const { data: existing } = await service
    .from("org_invites")
    .select("id")
    .eq("org_id", org.id)
    .eq("email", email)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (existing) {
    return NextResponse.json({ error: "An active invite already exists for this email" }, { status: 409 });
  }

  const { data: invite, error } = await service
    .from("org_invites")
    .insert({ org_id: org.id, email, invited_by: user.id })
    .select()
    .single();

  if (error || !invite) {
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }

  try {
    await sendInviteEmail({
      to: email,
      orgName: String((org as Record<string, unknown>).name ?? "your organization"),
      invitedBy: user.email ?? "A team member",
      token: invite.token,
    });
  } catch (err) {
    // Roll back the invite so the user can retry
    await service.from("org_invites").delete().eq("id", invite.id);
    const msg = err instanceof Error ? err.message : "Unknown email error";
    return NextResponse.json({ error: `Failed to send invite email: ${msg}` }, { status: 500 });
  }

  return NextResponse.json({ message: `Invite sent to ${email}` }, { status: 201 });
}

export async function GET(_req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrgForUser(user.id);
  if (!org) return NextResponse.json({ error: "No organization found" }, { status: 403 });

  const service = getServiceClient();

  const [{ data: members }, { data: invites }] = await Promise.all([
    service
      .from("org_members")
      .select("id, role, created_at, user_id")
      .eq("org_id", (org as Record<string, unknown>).id),
    service
      .from("org_invites")
      .select("id, email, accepted_at, expires_at, created_at")
      .eq("org_id", (org as Record<string, unknown>).id)
      .order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({ members: members ?? [], invites: invites ?? [] });
}
