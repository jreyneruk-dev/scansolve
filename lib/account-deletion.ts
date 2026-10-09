import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const BUCKET = "issue-photos";

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** Every object under a storage prefix, walking sub-folders (list() is one level deep). */
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

/** Removes the org's photos, logo and floor plans. Returns how many objects were deleted. */
export async function deleteOrgStorage(orgId: string, db: SupabaseClient = service()): Promise<number> {
  const paths = (
    await Promise.all([orgId, `logos/${orgId}`, `floorplans/${orgId}`].map((p) => listAll(db, p)))
  ).flat();
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await db.storage.from(BUCKET).remove(paths.slice(i, i + 100));
    if (error) throw new Error(`storage remove failed: ${error.message}`);
  }
  return paths.length;
}

export class DeletionAborted extends Error {}

/**
 * Deletes the signed-in user. An owner's organisation goes with them: the
 * subscription is cancelled first and nothing is deleted if that fails, so a
 * customer is never left paying for an account that no longer exists.
 * A member just leaves the organisation.
 */
export async function deleteAccount(userId: string, org: { id: string; owner_id?: string | null; stripe_subscription_id?: string | null } | null) {
  const db = service();

  let isOwner = false;
  if (org) {
    const { data: membership } = await db
      .from("org_members").select("role").eq("org_id", org.id).eq("user_id", userId).maybeSingle();
    isOwner = org.owner_id === userId || membership?.role === "owner";
  }

  if (org && isOwner) {
    if (org.stripe_subscription_id) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-05-27.dahlia" });
        await stripe.subscriptions.cancel(org.stripe_subscription_id);
      } catch (err) {
        // Already gone at Stripe is fine; anything else stops the deletion.
        const code = (err as { code?: string }).code;
        if (code !== "resource_missing") {
          throw new DeletionAborted("We couldn't cancel your subscription, so nothing was deleted. Please try again or email support@scansolve.co.");
        }
      }
    }
    await deleteOrgStorage(org.id, db);
    // Every org-owned table cascades from organizations.
    const { error } = await db.from("organizations").delete().eq("id", org.id);
    if (error) throw new Error(`org delete failed: ${error.message}`);
  } else if (org) {
    await db.from("org_members").delete().eq("org_id", org.id).eq("user_id", userId);
    await db.from("push_subscriptions").delete().eq("user_id", userId);
  }

  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) throw new Error(`user delete failed: ${error.message}`);
  return { deletedOrg: !!org && isOwner };
}
