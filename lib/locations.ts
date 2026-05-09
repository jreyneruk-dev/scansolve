import { createClient } from "@supabase/supabase-js";
import type { Location, CreateLocationInput } from "@/types/schema";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** Legacy lookup by UID only (kept for backward compat with old /scan/[uid] routes) */
export async function getLocationByUID(uid: string): Promise<Location | null> {
  const { data, error } = await getServiceClient()
    .from("locations")
    .select("*")
    .eq("uid", uid)
    .single();
  if (error || !data) return null;
  return data as Location;
}

/** Org-scoped lookup: joins via org_number → org_id → locations.uid */
export async function getLocationByOrgAndUID(
  orgNumber: number,
  uid: string
): Promise<Location | null> {
  // Look up the org by its short numeric ID first
  const { data: org, error: orgError } = await getServiceClient()
    .from("organizations")
    .select("id")
    .eq("org_number", orgNumber)
    .single();
  if (orgError || !org) return null;

  const { data, error } = await getServiceClient()
    .from("locations")
    .select("*")
    .eq("org_id", org.id)
    .eq("uid", uid)
    .single();
  if (error || !data) return null;
  return data as Location;
}

export async function createLocation(data: CreateLocationInput): Promise<Location> {
  const { data: row, error } = await getServiceClient()
    .from("locations")
    .insert({
      uid: data.uid,
      org_id: data.org_id,
      name: data.name,
      description: data.description,
      floor_plan_url: data.floor_plan_url,
      survey_config: data.survey_config,
      claimed_by: data.claimed_by,
      claimed_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error || !row) throw new Error(error?.message ?? "Failed to create location");
  return row as Location;
}

export async function updateLocation(id: string, data: Partial<Location>): Promise<Location> {
  const { data: row, error } = await getServiceClient()
    .from("locations")
    .update(data)
    .eq("id", id)
    .select()
    .single();
  if (error || !row) throw new Error(error?.message ?? "Failed to update location");
  return row as Location;
}

export async function getLocationsByOrg(orgId: string): Promise<Location[]> {
  const { data, error } = await getServiceClient()
    .from("locations")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Location[];
}
