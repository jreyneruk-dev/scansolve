import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// GET — fetch invite details (public, for the accept page)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const service = getServiceClient();

  const { data: invite } = await service
    .from("org_invites")
    .select("id, email, expires_at, accepted_at, org_id, organizations(name)")
    .eq("token", token)
    .single();

  if (!invite) return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
  if (invite.accepted_at) return NextResponse.json({ error: "This invite has already been used" }, { status: 410 });
  if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: "This invite has expired" }, { status: 410 });

  const orgName = (invite.organizations as unknown as Record<string, unknown> | null)?.name ?? "Unknown";
  return NextResponse.json({ email: invite.email, orgName });
}

// POST — accept the invite (requires auth)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = getServiceClient();

  const { data: invite } = await service
    .from("org_invites")
    .select("id, email, expires_at, accepted_at, org_id")
    .eq("token", token)
    .single();

  if (!invite) return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
  if (invite.accepted_at) return NextResponse.json({ error: "This invite has already been used" }, { status: 410 });
  if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: "This invite has expired" }, { status: 410 });

  // Verify the signed-in user's email matches the invite — prevents link hijacking
  if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      { error: "This invite was sent to a different email address. Please sign in with the invited email." },
      { status: 403 }
    );
  }

  // Add user to org
  const { error: memberError } = await service.from("org_members").insert({
    org_id: invite.org_id,
    user_id: user.id,
    role: "member",
  });

  if (memberError && !memberError.message.includes("duplicate")) {
    return NextResponse.json({ error: "Failed to join organization" }, { status: 500 });
  }

  // Mark invite as accepted
  await service
    .from("org_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  return NextResponse.json({ message: "Joined successfully" });
}
