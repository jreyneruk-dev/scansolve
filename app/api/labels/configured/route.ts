import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { getOrgForUser } from "@/lib/auth";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export interface ConfiguredLabel {
  id: string;
  uid: string;
  name: string;
  configuredBy: string;   // email or user ID fallback
  configuredAt: string;
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrgForUser(user.id);
  if (!org) return NextResponse.json({ labels: [] });

  const service = getServiceClient();

  // Fetch all configured locations for this org
  const { data: locations, error } = await service
    .from("locations")
    .select("id, uid, name, claimed_by, claimed_at, created_at")
    .eq("org_id", (org as Record<string, unknown>).id as string)
    .order("claimed_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!locations?.length) return NextResponse.json({ labels: [] });

  // Resolve unique user IDs → emails in one pass
  const uniqueUserIds = [...new Set(
    locations.map((l) => l.claimed_by).filter(Boolean) as string[]
  )];

  const emailMap: Record<string, string> = {};
  await Promise.all(
    uniqueUserIds.map(async (uid) => {
      const { data } = await service.auth.admin.getUserById(uid);
      if (data?.user?.email) emailMap[uid] = data.user.email;
    })
  );

  const labels: ConfiguredLabel[] = locations.map((loc) => ({
    id: loc.id,
    uid: loc.uid,
    name: loc.name,
    configuredBy: (loc.claimed_by && emailMap[loc.claimed_by]) || loc.claimed_by || "Unknown",
    configuredAt: loc.claimed_at ?? loc.created_at,
  }));

  return NextResponse.json({ labels });
}
