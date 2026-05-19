import { createClient } from "@supabase/supabase-js";

const BUCKET = "issue-photos";
const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 365; // 1 year in seconds

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

/**
 * Given a photo_url from the database (which may be an expired signed URL),
 * extract the storage path and return a fresh signed URL.
 * Falls back to the original value if it can't be parsed (e.g. external URL).
 */
export async function refreshPhotoUrl(storedUrl: string): Promise<string> {
  // Supabase signed URL format:
  // https://{project}.supabase.co/storage/v1/object/sign/{bucket}/{path}?token=...
  const match = storedUrl.match(/\/storage\/v1\/object\/sign\/[^/]+\/(.+?)(?:\?|$)/);
  if (!match) return storedUrl; // not a Supabase storage URL — return as-is
  const path = decodeURIComponent(match[1]);
  try {
    return await getSignedUrl(path);
  } catch {
    return storedUrl; // if re-signing fails, return original (better than blank)
  }
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
