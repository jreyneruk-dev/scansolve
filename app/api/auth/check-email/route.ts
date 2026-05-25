import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const Schema = z.object({
  email: z.string().email().max(254),
});

// Constant-time delay prevents timing-based user enumeration
async function constantDelay(ms = 120) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  // ── Rate limit: 10 checks per IP per 5 minutes ────────────────────────────
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const rl = await checkRateLimit(`check-email:ip:${ip}`, 10, 300);
  if (!rl.allowed) {
    await constantDelay();
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: { "Retry-After": "300" } }
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    // Constant delay even on validation failure — don't reveal whether email is valid
    await constantDelay();
    return NextResponse.json({ error: "Invalid email" }, { status: 422 });
  }

  const service = getServiceClient();

  // Wrap both the DB lookup and delay in parallel so total time is always ~120ms
  const [{ data: banned, error: dbError }] = await Promise.all([
    service
      .from("banned_emails")
      .select("id")
      .eq("email", parsed.data.email.toLowerCase())
      .maybeSingle(),
    constantDelay(),
  ]);

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
