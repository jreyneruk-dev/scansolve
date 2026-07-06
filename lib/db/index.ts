import { SupabaseAdapter } from "./supabase-adapter";
import type { IDataAdapter } from "./adapter";

// Supabase is the only data backend. The IDataAdapter interface is kept so an
// own-data backend (Google Sheets / Airtable) can be reintroduced later, but the
// prior adapters were never exercised against a real backend and were removed
// (see docs/FOUNDATIONS-REVIEW.md and docs/SECURITY-BACKLOG.md). The orgId
// parameter is retained for call-site compatibility.
export async function getAdapter(_orgId?: string): Promise<IDataAdapter> {
  return new SupabaseAdapter();
}
