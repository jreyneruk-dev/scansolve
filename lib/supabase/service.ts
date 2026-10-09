import { createClient } from "@supabase/supabase-js";

/** Service-role client for server code only. Bypasses RLS — scope every query yourself. */
export function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}
