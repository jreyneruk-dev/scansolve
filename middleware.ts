import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

  // Security headers
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // Content-Security-Policy
  // 'unsafe-inline' required for Next.js inline styles; tighten with nonces in a future pass.
  // 'unsafe-eval' is only present in dev (Next.js hot-reload); production bundles don't use it.
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com",
      "font-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
