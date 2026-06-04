import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth, getOrgForUser } from "@/lib/auth";
import { getEffectivePlan } from "@/lib/plans";
import type { Organization } from "@/types/schema";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

export async function POST() {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await getOrgForUser(user.id);
  if (!org) {
    return NextResponse.json({ error: "No organisation found" }, { status: 404 });
  }

  // Already on prime or enterprise — nothing to do
  const effectivePlan = getEffectivePlan(org as unknown as Organization);
  if (effectivePlan !== "free") {
    return NextResponse.json({ error: "Already on a paid plan" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const orgId = (org as Record<string, unknown>).id as string;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/dashboard/billing?success=1`,
    cancel_url: `${appUrl}/dashboard/billing?cancelled=1`,
    metadata: {
      org_id: orgId,
      user_id: user.id,
    },
    subscription_data: {
      metadata: {
        org_id: orgId,
      },
    },
    // Pre-fill email so checkout is faster
    customer_email: user.email,
  });

  return NextResponse.json({ url: session.url });
}
