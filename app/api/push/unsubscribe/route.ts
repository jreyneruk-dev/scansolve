import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getOptionalUser, getOrgForUser } from "@/lib/auth";
import { z } from "zod";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const Schema = z.object({ endpoint: z.string().url().max(1024) });

// No plan gate: a device must always be able to unsubscribe.
export async function POST(req: NextRequest) {
  const user = await getOptionalUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrgForUser(user.id);
  if (!org) return NextResponse.json({ error: "No organisation found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 422 });
  }

  const orgId = (org as Record<string, unknown>).id as string;
  const db = getServiceClient();
  // Scope delete to this org so a subscription can only be removed by its owner org.
  const { error } = await db
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", parsed.data.endpoint)
    .eq("org_id", orgId);
  if (error) {
    console.error("[push/unsubscribe] db error:", error.message);
    return NextResponse.json({ error: "Could not unsubscribe." }, { status: 500 });
  }

  return NextResponse.json({ unsubscribed: true });
}
