import type { IDataAdapter } from "./adapter";
import type { Issue, CreateIssueInput, IssueFilters, UpdateIssueInput } from "@/types/schema";

const ISSUES_TABLE = "Issues";

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

export class AirtableAdapter implements IDataAdapter {
  private baseId: string;
  private apiKey: string;

  constructor(credentials: { base_id: string; api_key: string }) {
    this.baseId = credentials.base_id;
    this.apiKey = credentials.api_key;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `https://api.airtable.com/v0/${this.baseId}/${encodeURIComponent(path)}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Airtable error ${res.status}: ${JSON.stringify(err)}`);
    }
    return res.json() as Promise<T>;
  }

  private recordToIssue(record: AirtableRecord): Issue {
    const f = record.fields;
    return {
      id: record.id,
      location_id: String(f.location_id ?? ""),
      org_id: String(f.org_id ?? ""),
      status: (f.status as Issue["status"]) ?? "reported",
      category: String(f.category ?? ""),
      description: f.description ? String(f.description) : undefined,
      photo_url: f.photo_url ? String(f.photo_url) : undefined,
      contact_email: f.contact_email ? String(f.contact_email) : undefined,
      reporter_meta: f.reporter_meta ? JSON.parse(String(f.reporter_meta)) : undefined,
      assigned_to: f.assigned_to ? String(f.assigned_to) : undefined,
      assigned_at: f.assigned_at ? String(f.assigned_at) : undefined,
      resolved_at: f.resolved_at ? String(f.resolved_at) : undefined,
      created_at: String(f.created_at ?? new Date().toISOString()),
      updated_at: String(f.updated_at ?? new Date().toISOString()),
    };
  }

  async createIssue(
    data: CreateIssueInput & { location_id: string; org_id: string }
  ): Promise<Issue> {
    const now = new Date().toISOString();
    const fields: Record<string, unknown> = {
      location_id: data.location_id,
      org_id: data.org_id,
      status: "reported",
      category: data.category,
      created_at: now,
      updated_at: now,
    };
    if (data.description) fields.description = data.description;
    if (data.photo_url) fields.photo_url = data.photo_url;
    if (data.contact_email) fields.contact_email = data.contact_email;
    if (data.reporter_meta) fields.reporter_meta = JSON.stringify(data.reporter_meta);

    const result = await this.request<{ id: string; fields: Record<string, unknown> }>(
      ISSUES_TABLE,
      { method: "POST", body: JSON.stringify({ fields }) }
    );
    return this.recordToIssue(result);
  }

  async getIssuesByOrg(orgId: string, filters?: IssueFilters): Promise<Issue[]> {
    const formulaParts = [`{org_id} = "${orgId}"`];
    if (filters?.status) formulaParts.push(`{status} = "${filters.status}"`);
    if (filters?.location_id) formulaParts.push(`{location_id} = "${filters.location_id}"`);

    const formula = formulaParts.length > 1
      ? `AND(${formulaParts.join(", ")})`
      : formulaParts[0];

    const params = new URLSearchParams({
      filterByFormula: formula,
      sort: JSON.stringify([{ field: "created_at", direction: "desc" }]),
      ...(filters?.limit ? { pageSize: String(Math.min(filters.limit, 100)) } : {}),
    });

    const result = await this.request<{ records: AirtableRecord[] }>(
      `${ISSUES_TABLE}?${params}`
    );
    return (result.records ?? []).map(this.recordToIssue);
  }

  async getIssueById(id: string, orgId: string): Promise<Issue | null> {
    try {
      const record = await this.request<AirtableRecord>(`${ISSUES_TABLE}/${id}`);
      if (record.fields.org_id !== orgId) return null;
      return this.recordToIssue(record);
    } catch {
      return null;
    }
  }

  async updateIssue(id: string, orgId: string, data: UpdateIssueInput): Promise<Issue> {
    const now = new Date().toISOString();
    const fields: Record<string, unknown> = { ...data, updated_at: now };
    if (data.status === "resolved") fields.resolved_at = now;
    if (data.status === "assigned" && data.assigned_to) fields.assigned_at = now;

    const existing = await this.getIssueById(id, orgId);
    if (!existing) throw new Error("Issue not found");

    const result = await this.request<AirtableRecord>(
      `${ISSUES_TABLE}/${id}`,
      { method: "PATCH", body: JSON.stringify({ fields }) }
    );
    return this.recordToIssue(result);
  }
}
