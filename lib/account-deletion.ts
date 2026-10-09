import { getServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/stripe";
import { deleteOrgStorage } from "@/lib/storage";

export class DeletionAborted extends Error {}

/**
 * Deletes the signed-in user. An owner's organisation goes with them: the
 * subscription is cancelled first and nothing is deleted if that fails, so a
 * customer is never left paying for an account that no longer exists.
 * A member just leaves the organisation.
 */
export async function deleteAccount(
  userId: string,
  org: { id: string; owner_id?: string | null; stripe_subscription_id?: string | null } | null
): Promise<void> {
  const db = getServiceClient();

  if (org) {
    const { data: membership } = await db
      .from("org_members").select("role").eq("org_id", org.id).eq("user_id", userId).maybeSingle();

    if (org.owner_id === userId || membership?.role === "owner") {
      if (org.stripe_subscription_id) {
        try {
          await getStripe().subscriptions.cancel(org.stripe_subscription_id);
        } catch (err) {
          // Already gone at Stripe is fine; anything else stops the deletion.
          if ((err as { code?: string }).code !== "resource_missing") {
            throw new DeletionAborted("We couldn't cancel your subscription, so nothing was deleted. Please try again or email support@scansolve.co.");
          }
        }
      }
      await deleteOrgStorage(org.id);
      // Every org-owned table cascades from organizations.
      const { error } = await db.from("organizations").delete().eq("id", org.id);
      if (error) throw new Error(`org delete failed: ${error.message}`);
    } else {
      await db.from("org_members").delete().eq("org_id", org.id).eq("user_id", userId);
      await db.from("push_subscriptions").delete().eq("user_id", userId);
    }
  }

  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) throw new Error(`user delete failed: ${error.message}`);
}
