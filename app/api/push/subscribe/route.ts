import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getOptionalUser, getOrgForUser } from "@/lib/auth";
import { getOrgLimits } from "@/lib/plans";
import { checkRateLimit } from "@/lib/rate-limit";
import type { Organization } from "@/types/schema";
import { z } from "zod";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const Schema = z.object({
  endpoint: z.string().url().max(1024),
  keys: z.object({
    p256dh: z.string().min(1).max(256),
    auth: z.string().min(1).max(256),
  }),
});

// The stored endpoint is POSTed server-side on every new issue, so an unconstrained
// URL is an SSRF vector (cloud metadata, localhost services). Only accept https URLs
// on the real browser push services.
const ALLOWED_PUSH_HOSTS = [
  /(^|\.)push\.apple\.com$/,            // Safari / APNs
  /(^|\.)googleapis\.com$/,             // Chrome / Edge / Android (FCM)
  /(^|\.)push\.services\.mozilla\.com$/, // Firefox
  /(^|\.)notify\.windows\.com$/,        // Windows / WNS
];

function isAllowedPushEndpoint(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === "https:" && ALLOWED_PUSH_HOSTS.some((re) => re.test(hostname));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const user = await getOptionalUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrgForUser(user.id);
  if (!org) return NextResponse.json({ error: "No organisation found" }, { status: 404 });

  // Prime gate (reuses the instant-alerts plan limit)
  const limits = getOrgLimits(org as unknown as Organization);
  if (!limits.hasSmsWhatsApp) {
    return NextResponse.json(
      { error: "Instant alerts are a Prime feature.", code: "UPGRADE_REQUIRED" },
      { status: 403 }
    );
  }

  const orgId = (org as Record<string, unknown>).id as string;
  const rl = await checkRateLimit(`push_sub:org:${orgId}`, 30, 3600);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subscription." }, { status: 422 });
  }

  const { endpoint, keys } = parsed.data;
  if (!isAllowedPushEndpoint(endpoint)) {
    return NextResponse.json({ error: "Unsupported push endpoint." }, { status: 422 });
  }
  const db = getServiceClient();

  // Upsert by endpoint so re-subscribing the same device doesn't duplicate,
  // and a device that moves orgs is re-pointed to the current one.
  const { error } = await db
    .from("push_subscriptions")
    .upsert(
      {
        org_id: orgId,
        user_id: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: (req.headers.get("user-agent") ?? "").slice(0, 200),
      },
      { onConflict: "endpoint" }
    );
  if (error) {
    console.error("[push/subscribe] db error:", error.message);
    return NextResponse.json({ error: "Could not save subscription." }, { status: 500 });
  }

  return NextResponse.json({ subscribed: true });
}
