import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendMagicLinkEmail } from "@/lib/email";
import { sameOriginUrl } from "@/lib/sanitize";
import { z } from "zod";

/**
 * Passwordless sign-in / sign-up that sends the magic link + OTP via Resend
 * instead of Supabase's built-in (heavily rate-limited, testing-only) email
 * sender. Mirrors app/api/auth/send-to-recovery but targets the user's own
 * inbox and creates the user on first sign-in (shouldCreateUser parity).
 *
 * The user is NOT signed in here — they still verify the OTP / click the link.
 */

const Schema = z.object({
  email: z.string().email().max(254),
  redirectTo: z.string().url().optional(),
});

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 422 });
  }
  const { email, redirectTo } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  // Rate limit: per IP and per email, to throttle abuse without blocking a
  // genuine user retrying from a new network.
  const [ipRl, emailRl] = await Promise.all([
    checkRateLimit(`magiclink:ip:${ip}`, 8, 3600),
    checkRateLimit(`magiclink:email:${normalizedEmail}`, 5, 3600),
  ]);
  if (!ipRl.allowed || !emailRl.allowed) {
    await delay();
    return NextResponse.json(
      { error: "Too many sign-in requests. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  const service = getServiceClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scansolve.co";
  // Only honour a redirectTo that points back at our own origin — otherwise the
  // verified magic-link auth code could be relayed to an attacker domain.
  const callbackUrl = sameOriginUrl(redirectTo, appUrl, `${appUrl}/auth/callback`);

  // Generate a magic link + OTP. For an existing user this works directly; for
  // a new user the first call fails, so we create the user (passwordless) and
  // retry once — matching signInWithOtp({ shouldCreateUser: true }).
  let { data, error } = await service.auth.admin.generateLink({
    type: "magiclink",
    email: normalizedEmail,
    options: { redirectTo: callbackUrl },
  });

  if (error || !data?.properties) {
    await service.auth.admin.createUser({ email: normalizedEmail, email_confirm: true });
    ({ data, error } = await service.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
      options: { redirectTo: callbackUrl },
    }));
  }

  if (error || !data?.properties) {
    console.error("[auth/magic-link] generateLink failed:", error?.message);
    return NextResponse.json({ error: "Could not start sign-in. Please try again." }, { status: 500 });
  }

  try {
    await sendMagicLinkEmail({
      to: normalizedEmail,
      otp: data.properties.email_otp,
      magicLink: data.properties.action_link,
    });
  } catch (err) {
    console.error("[auth/magic-link] email send failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Could not send the sign-in email. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ sent: true });
}
