import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
  const supabase = await createSupabaseServerClient();
  // Check org_members first (supports multi-user orgs)
  const { data: membership } = await supabase
    .from("org_members")
    .select("organizations(*)")
    .eq("user_id", userId)
    .limit(1)
    .single();
  if (membership?.organizations) return membership.organizations as unknown as Record<string, unknown>;

  // Backwards compat: orgs created before the org_members migration
  const { data } = await supabase
    .from("organizations")
    .select("*")
    .eq("owner_id", userId)
    .single();
  return data;
}
