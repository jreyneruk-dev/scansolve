import { createClient } from "@supabase/supabase-js";
import type { IDataAdapter } from "./adapter";
import type { Issue, CreateIssueInput, IssueFilters, UpdateIssueInput } from "@/types/schema";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export class SupabaseAdapter implements IDataAdapter {
  private client = getServiceClient();

  async createIssue(
    data: CreateIssueInput & { location_id: string; org_id: string }
  ): Promise<Issue> {
    const { data: row, error } = await this.client
      .from("issues")
      .insert({
        location_id: data.location_id,
        org_id: data.org_id,
        category: data.category,
        description: data.description,
        photo_url: data.photo_url,
        contact_email: data.contact_email,
        reporter_meta: data.reporter_meta,
        status: "reported",
      })
      .select()
      .single();
    if (error || !row) throw new Error(error?.message ?? "Failed to create issue");
    return row as Issue;
  }

  async getIssuesByOrg(orgId: string, filters?: IssueFilters): Promise<Issue[]> {
    let q = this.client
      .from("issues")
      .select("*, location:locations(name, uid)")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (filters?.status) q = q.eq("status", filters.status);
    if (filters?.location_id) q = q.eq("location_id", filters.location_id);
    if (filters?.from) q = q.gte("created_at", filters.from);
    if (filters?.to) q = q.lte("created_at", filters.to);
    if (filters?.limit) q = q.limit(filters.limit);
    if (filters?.offset) q = q.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1);

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as Issue[];
  }

  async getIssueById(id: string, orgId: string): Promise<Issue | null> {
    const { data, error } = await this.client
      .from("issues")
      .select("*, location:locations(name, uid)")
      .eq("id", id)
      .eq("org_id", orgId)
      .single();
    if (error || !data) return null;
    return data as Issue;
  }

  async updateIssue(id: string, orgId: string, data: UpdateIssueInput): Promise<Issue> {
    const updates: Record<string, unknown> = {
      ...data,
      updated_at: new Date().toISOString(),
    };
    if (data.status === "resolved") updates.resolved_at = new Date().toISOString();
    if (data.status === "assigned" && data.assigned_to) updates.assigned_at = new Date().toISOString();

    const { data: row, error } = await this.client
      .from("issues")
      .update(updates)
      .eq("id", id)
      .eq("org_id", orgId)
      .select()
      .single();
    if (error || !row) throw new Error(error?.message ?? "Failed to update issue");
    return row as Issue;
  }
}
