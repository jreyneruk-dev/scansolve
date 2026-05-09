import { createClient } from "@supabase/supabase-js";

const BUCKET = "issue-photos";
const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 7; // 7 days in seconds

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function uploadIssuePhoto(
  orgId: string,
  issueId: string,
  file: File
): Promise<string> {
  const supabase = getServiceClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${orgId}/${issueId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);

  return getSignedUrl(path);
}

export async function getSignedUrl(path: string): Promise<string> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY);
  if (error || !data) throw new Error(error?.message ?? "Failed to sign URL");
  return data.signedUrl;
}

export async function uploadFloorPlan(
  orgId: string,
  locationId: string,
  file: File
): Promise<string> {
  const supabase = getServiceClient();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `floorplans/${orgId}/${locationId}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw new Error(error.message);

  return getSignedUrl(path);
}
