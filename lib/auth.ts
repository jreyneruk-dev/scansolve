import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function requireAuth(redirectTo?: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : "";
    redirect(`/auth${next}`);
  }
  return user;
}

export async function getOrgForUser(userId: string) {
  // Use the service role to bypass RLS — the org_members SELECT policy is
  // user-scoped and new invited members hit a bootstrap deadlock where they
  // cannot read their own freshly-inserted row. The userId here is always
  // pre-verified by requireAuth(), so using service role is safe.
  const service = getServiceClient();

  // Check org_members first (supports multi-user orgs)
  const { data: membership } = await service
    .from("org_members")
    .select("organizations(*)")
    .eq("user_id", userId)
    .limit(1)
    .single();
  if (membership?.organizations) return membership.organizations as unknown as Record<string, unknown>;

  // Backwards compat: orgs created before the org_members migration
  const { data } = await service
    .from("organizations")
    .select("*")
    .eq("owner_id", userId)
    .single();
  return data;
}
