import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const Schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 422 });
  }

  const service = getServiceClient();
  const { data: banned, error: dbError } = await service
    .from("banned_emails")
    .select("id")
    .eq("email", parsed.data.email.toLowerCase())
    .maybeSingle();

  if (dbError) {
    console.error("[check-email] banned_emails query failed:", dbError.message, dbError.code);
  }

  if (banned) {
    return NextResponse.json(
      { banned: true, message: "This account has been suspended. Please contact support." },
      { status: 403 }
    );
  }

  return NextResponse.json({ banned: false });
}
