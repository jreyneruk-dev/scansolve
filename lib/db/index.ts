import { createClient } from "@supabase/supabase-js";
import { decrypt } from "@/lib/crypto";
import { SupabaseAdapter } from "./supabase-adapter";
import { SheetsAdapter } from "./sheets-adapter";
import { AirtableAdapter } from "./airtable-adapter";
import type { IDataAdapter } from "./adapter";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function getAdapter(orgId?: string): Promise<IDataAdapter> {
  if (!orgId) return new SupabaseAdapter();

  const { data: org } = await getServiceClient()
    .from("organizations")
    .select("backend, backend_credentials")
    .eq("id", orgId)
    .single();

  if (!org || org.backend === "supabase" || !org.backend_credentials) {
    return new SupabaseAdapter();
  }

  try {
    const decrypted = decrypt(org.backend_credentials as string);
    const creds = JSON.parse(decrypted);

    if (org.backend === "sheets") {
      return new SheetsAdapter(creds);
    }
    if (org.backend === "airtable") {
      return new AirtableAdapter(creds);
    }
  } catch (err) {
    console.error("Failed to initialise backend adapter, falling back to Supabase:", err);
  }

  return new SupabaseAdapter();
}
