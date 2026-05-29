import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const isProd = process.env.NODE_ENV === "production";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Session refresh for Supabase auth (keeps cookies fresh)
  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              response.cookies.set(name, value, options as any)
            );
          },
        },
      }
    );

    // Protect dashboard and onboarding routes — commission is public (unauthenticated scan)
    const protectedPaths = ["/dashboard", "/onboarding"];
    if (protectedPaths.some((p) => pathname.startsWith(p))) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
    }
  } catch {
    // If Supabase is unreachable, allow the request through —
    // individual route handlers will handle auth errors gracefully.
  }

  // ── Security headers ──────────────────────────────────────────────────────

  // HSTS — 2 years, include subdomains, preload-ready
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );

  // Prevent MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Block framing entirely
  response.headers.set("X-Frame-Options", "DENY");

  // Minimal referrer leakage
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Restrict browser features — camera/geolocation/mic only if explicitly needed
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
  );

  // Prevent opener attacks from popups
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");

  // Prevent cross-origin resource embedding abuse
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  // Suppress DNS prefetching (minor info-leak reduction)
  response.headers.set("X-DNS-Prefetch-Control", "off");

  // Remove server fingerprint header (Next.js adds X-Powered-By; this is belt-and-suspenders)
  response.headers.delete("X-Powered-By");

  // ── Content Security Policy ───────────────────────────────────────────────
  // 'unsafe-inline' is required for Next.js inline styles and hydration scripts.
  // 'unsafe-eval' is ONLY added in development (Next.js HMR requires it).
  // In production we drop it entirely — production bundles never need eval().
  const scriptSrc = isProd
    ? "'self' 'unsafe-inline'"
    : "'self' 'unsafe-inline' 'unsafe-eval'";

  const supabaseHost = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/^https?:\/\//, "");

  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      // Supabase signed URLs + data: for client-generated QR code PNGs
      `img-src 'self' data: https://${supabaseHost} https://*.supabase.co`,
      // API calls: Supabase (data + realtime), Resend, Google AI
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com https://generativelanguage.googleapis.com",
      "font-src 'self'",
      // No iframes anywhere
      "frame-src 'none'",
      "frame-ancestors 'none'",
      // Restrict base tag hijacking
      "base-uri 'self'",
      // Only allow same-origin form posts
      "form-action 'self'",
      // Block mixed content
      "upgrade-insecure-requests",
    ].join("; ")
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
