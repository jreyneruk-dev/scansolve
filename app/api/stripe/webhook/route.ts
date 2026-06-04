import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function setOrgPlan(
  orgId: string,
  plan: "prime" | "free",
  source: "paid" | "free",
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
) {
  const db = getServiceClient();
  const update: Record<string, unknown> = {
    plan,
    plan_source: source,
    plan_expires_at: null,
  };
  if (stripeCustomerId) update.stripe_customer_id = stripeCustomerId;
  if (stripeSubscriptionId) update.stripe_subscription_id = stripeSubscriptionId;

  const { error } = await db
    .from("organizations")
    .update(update)
    .eq("id", orgId);

  if (error) {
    console.error("[stripe/webhook] Failed to update org plan:", error.message);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    // In dev (no webhook secret), parse the event directly without verification
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.warn("[stripe/webhook] No webhook secret — skipping signature verification (dev mode)");
      const event = JSON.parse(body) as Stripe.Event;
      await handleEvent(event);
      return NextResponse.json({ received: true });
    }
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe/webhook] Signature verification failed:", msg);
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 });
  }

  await handleEvent(event);
  return NextResponse.json({ received: true });
}

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") break;
      const orgId = session.metadata?.org_id;
      if (!orgId) break;
      await setOrgPlan(
        orgId,
        "prime",
        "paid",
        session.customer as string | undefined,
        session.subscription as string | undefined
      );
      console.log(`[stripe/webhook] org ${orgId} → prime (checkout completed)`);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = sub.metadata?.org_id;
      if (!orgId) break;
      // Active or trialing = prime; anything else = downgrade
      const active = sub.status === "active" || sub.status === "trialing";
      await setOrgPlan(
        orgId,
        active ? "prime" : "free",
        active ? "paid" : "free",
        sub.customer as string | undefined,
        sub.id
      );
      console.log(`[stripe/webhook] org ${orgId} → ${active ? "prime" : "free"} (sub updated, status=${sub.status})`);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = sub.metadata?.org_id;
      if (!orgId) break;
      await setOrgPlan(orgId, "free", "free");
      console.log(`[stripe/webhook] org ${orgId} → free (sub cancelled)`);
      break;
    }

    default:
      // Ignore unhandled events
      break;
  }
}
