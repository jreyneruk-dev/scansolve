import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const BUCKET = "issue-photos";
const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 365; // 1 year in seconds
const LOGO_URL_EXPIRY  = 60 * 60 * 24 * 365 * 10; // 10 years — logos rarely change

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
  const path = storagePathFromSignedUrl(storedUrl);
  if (!path) return storedUrl; // not a Supabase storage URL — return as-is
  try {
    return await getSignedUrl(path);
  } catch {
    return storedUrl; // if re-signing fails, return original (better than blank)
  }
}

/**
 * Upload an org logo. Overwrites any existing logo for this org.
 * Returns a 10-year signed URL suitable for storing in organizations.logo_url.
 */
export async function uploadOrgLogo(orgId: string, file: File): Promise<string> {
  const supabase = getServiceClient();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `logos/${orgId}/logo.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw new Error(error.message);

  const { data, signError } = await (async () => {
    const res = await supabase.storage.from(BUCKET).createSignedUrl(path, LOGO_URL_EXPIRY);
    return { data: res.data, signError: res.error };
  })();
  if (signError || !data) throw new Error(signError?.message ?? "Failed to sign logo URL");
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

/**
 * Storage path inside the bucket from a Supabase signed URL
 * (https://{project}.supabase.co/storage/v1/object/sign/{bucket}/{path}?token=...).
 */
export function storagePathFromSignedUrl(url: string): string | null {
  const match = url.match(/\/storage\/v1\/object\/sign\/[^/]+\/(.+?)(?:\?|$)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** A photo_url must be one of our Supabase signed storage URLs, never an arbitrary link. */
export const signedPhotoUrl = z
  .string()
  .url()
  .refine(
    (url) => {
      try {
        const { hostname, pathname } = new URL(url);
        return hostname.endsWith(".supabase.co") && pathname.startsWith("/storage/v1/object/sign/");
      } catch {
        return false;
      }
    },
    { message: "photo_url must be a Supabase signed storage URL" }
  );

/** Every object under a prefix, walking sub-folders (list() is one level deep). */
async function listAll(db: SupabaseClient, prefix: string): Promise<string[]> {
  const out: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.storage.from(BUCKET).list(prefix, { limit: 1000, offset });
    if (error) throw new Error(`storage list failed: ${error.message}`);
    for (const entry of data ?? []) {
      const path = `${prefix}/${entry.name}`;
      // Folders come back with a null id.
      if (entry.id === null) out.push(...(await listAll(db, path)));
      else out.push(path);
    }
    if (!data || data.length < 1000) return out;
  }
}

/** Removes everything the upload helpers above store for an org: photos, logo, floor plans. */
export async function deleteOrgStorage(orgId: string): Promise<void> {
  const db = getServiceClient();
  const paths = (await Promise.all([orgId, `logos/${orgId}`, `floorplans/${orgId}`].map((p) => listAll(db, p)))).flat();
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await db.storage.from(BUCKET).remove(paths.slice(i, i + 100));
    if (error) throw new Error(`storage remove failed: ${error.message}`);
  }
}
