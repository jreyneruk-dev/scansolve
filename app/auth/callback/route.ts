import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Handles two Supabase email-link formats:
 *
 * 1. PKCE "code" format — used when the email was initiated from this browser
 *    (code verifier is in localStorage). exchangeCodeForSession() does the swap.
 *
 * 2. "token_hash" format — used by Supabase's "Confirm your signup" email and
 *    by magic links opened in a different browser than where the OTP was sent.
 *    verifyOtp() handles this without needing a code verifier.
 *
 * After a successful auth, if there is no explicit `next` destination the user
 * is sent to /dashboard, which already checks for pending invites and redirects
 * accordingly — so invite acceptances always end up back at the invite page.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code       = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type       = searchParams.get("type") as "signup" | "email" | "recovery" | null;
  const next       = searchParams.get("next") ?? "/dashboard";

  const supabase = await createSupabaseServerClient();
  let authed = false;

  if (code) {
    // PKCE flow — exchange the authorization code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) authed = true;
  }

  if (!authed && token_hash && type) {
    // token_hash flow — "Confirm your signup" or cross-browser magic links
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) authed = true;
  }

  if (authed) {
    // Check if this email has been permanently banned
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const service = getServiceClient();
      const { data: banned } = await service
        .from("banned_emails")
        .select("id")
        .eq("email", user.email.toLowerCase())
        .maybeSingle();
      if (banned) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/auth?error=banned", request.url));
      }
    }
    // If the caller specified a destination, use it.
    // Otherwise fall through to /dashboard which handles the pending-invite check.
    return NextResponse.redirect(new URL(next, request.url));
  }

  // Both methods failed. If the user was heading to an invite page, send them
  // there anyway so they can enter the OTP code manually (the form handles the
  // unauthenticated state cleanly).
  if (next.startsWith("/invite/")) {
    return NextResponse.redirect(new URL(next, request.url));
  }

  return NextResponse.redirect(new URL("/auth?error=auth_failed", request.url));
}
