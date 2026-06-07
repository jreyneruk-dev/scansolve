import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getOptionalUser, getOrgForUser } from "@/lib/auth";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// No plan gate: a downgraded org must always be able to turn alerts off.
export async function POST() {
  const user = await getOptionalUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrgForUser(user.id);
  if (!org) return NextResponse.json({ error: "No organisation found" }, { status: 404 });

  const orgId = (org as Record<string, unknown>).id as string;
  const db = getServiceClient();
  const { error } = await db
    .from("organizations")
    .update({ notify_phone: null, notify_channel: null, notify_verified: false })
    .eq("id", orgId);
  if (error) {
    console.error("[notifications/disable] db update failed:", error.message);
    return NextResponse.json({ error: "Could not disable alerts. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ disabled: true });
}
