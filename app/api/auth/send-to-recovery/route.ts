import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendRecoveryCodeEmail } from "@/lib/email";
import { sameOriginUrl } from "@/lib/sanitize";
import { z } from "zod";

const Schema = z.object({
  primaryEmail: z.string().email().max(254),
  redirectTo: z.string().url().optional(),
});

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// Constant-time delay to prevent timing-based enumeration
const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  // ── Rate limit: 3 recovery requests per IP per hour ──────────────────────
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const rl = await checkRateLimit(`recovery:ip:${ip}`, 3, 3600);
  if (!rl.allowed) {
    await delay();
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 422 });
  }

  const { primaryEmail, redirectTo } = parsed.data;
  const service = getServiceClient();

  // ── Look up user by primary email ─────────────────────────────────────────
  // We page through users to find the one matching the primary email.
  // For small user bases this is fine; scale to a lookup table if needed.
  const { data: listData, error: listError } = await service.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    console.error("[send-to-recovery] listUsers failed:", listError.message);
    return NextResponse.json({ error: "Service unavailable." }, { status: 500 });
  }

  const user = listData.users.find(
    (u) => u.email?.toLowerCase() === primaryEmail.toLowerCase()
  );

  // ── Always respond the same way when no user / no recovery email ──────────
  // This prevents attackers from enumerating valid email addresses.
  if (!user) {
    await delay();
    return NextResponse.json({ sent: true });
  }

  const recoveryEmail = user.user_metadata?.recovery_email as string | undefined;
  if (!recoveryEmail) {
    // Tell the UI there's no recovery email so it can show a helpful message.
    // This doesn't reveal whether the primary email has an account.
    return NextResponse.json(
      { error: "No recovery email is configured for this account." },
      { status: 404 }
    );
  }

  // ── Generate a magic link + OTP for the primary email ────────────────────
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scansolve.co";
  // Same-origin only — don't relay the verified auth code to an external URL.
  const callbackUrl = sameOriginUrl(redirectTo, appUrl, `${appUrl}/auth/callback`);

  const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
    type: "magiclink",
    email: primaryEmail,
    options: { redirectTo: callbackUrl },
  });

  if (linkError || !linkData?.properties) {
    console.error("[send-to-recovery] generateLink failed:", linkError?.message);
    return NextResponse.json({ error: "Failed to generate sign-in link." }, { status: 500 });
  }

  // ── Send OTP + magic link to the recovery email via Resend ───────────────
  try {
    await sendRecoveryCodeEmail({
      to: recoveryEmail,
      primaryEmail,
      otp: linkData.properties.email_otp,
      magicLink: linkData.properties.action_link,
    });
  } catch (err) {
    console.error("[send-to-recovery] email send failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Failed to send recovery email." }, { status: 500 });
  }

  return NextResponse.json({ sent: true });
}
