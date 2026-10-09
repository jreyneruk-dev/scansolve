import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { reviewConfig, codesMatch } from "@/lib/review-account";
import { getServiceClient } from "@/lib/supabase/service";

const Schema = z.object({ email: z.string().email().max(254), code: z.string().min(1).max(64) });

export async function POST(req: NextRequest) {
  const cfg = reviewConfig();
  if (!cfg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  // Per-IP plus a global ceiling, so spreading guesses across IPs doesn't help.
  const [rl, global] = await Promise.all([
    checkRateLimit(`review_login:ip:${ip}`, 10, 3600),
    checkRateLimit("review_login:global", 60, 3600),
  ]);
  if (!rl.allowed || !global.allowed) return NextResponse.json({ error: "Too many attempts. Please wait." }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success || parsed.data.email.toLowerCase() !== cfg.email || !codesMatch(parsed.data.code, cfg.code)) {
    return NextResponse.json({ error: "That code isn't right." }, { status: 401 });
  }

  const service = getServiceClient();
  const { data: link, error: linkError } = await service.auth.admin.generateLink({ type: "magiclink", email: cfg.email });
  if (linkError || !link?.properties || !link.user) {
    console.error("[review-login] generateLink failed:", linkError?.message);
    return NextResponse.json({ error: "Demo account unavailable." }, { status: 503 });
  }

  // Confinement: the review user may belong to the demo organisation and nothing else,
  // so a leaked code can never open a real customer's data.
  const [{ data: memberships }, { data: owned }] = await Promise.all([
    service.from("org_members").select("org_id").eq("user_id", link.user.id),
    service.from("organizations").select("id").eq("owner_id", link.user.id),
  ]);
  const orgIds = [...(memberships ?? []).map((m) => m.org_id), ...(owned ?? []).map((o) => o.id)];
  if (!orgIds.length || orgIds.some((id) => id !== cfg.orgId)) {
    console.error("[review-login] refused: review user is not confined to the demo org");
    return NextResponse.json({ error: "Demo account unavailable." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
  if (error) {
    console.error("[review-login] verify failed:", error.message);
    return NextResponse.json({ error: "Demo account unavailable." }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
