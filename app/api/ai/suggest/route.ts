import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { getServerEnv } from "@/lib/server-env";
import { checkRateLimit } from "@/lib/rate-limit";

// In-process cache — 24h TTL per room name
const cache = new Map<string, { categories: string[]; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  // Auth required — Super Users only
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 20 AI requests per user per hour
  const rl = await checkRateLimit(`ai:user:${user.id}`, 20, 3600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "AI suggestion limit reached. Please try again later." },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { roomName } = body as { roomName?: string };
  if (!roomName || typeof roomName !== "string" || !roomName.trim()) {
    return NextResponse.json({ error: "roomName is required" }, { status: 422 });
  }

  const key = roomName.toLowerCase().trim();

  // Return cached result if available
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ categories: cached.categories });
  }

  const apiKey = getServerEnv("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured — add ANTHROPIC_API_KEY to .env.local" }, { status: 503 });
  }

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `Generate 6-8 concise maintenance issue categories for a facilities location named "${roomName.trim()}". Return ONLY a JSON array of short strings (2-4 words each), nothing else. Example: ["Leak", "Cleaning Required", "Broken Fixture", "No Paper"]`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "[]";

    // Strip markdown code fences if Claude wraps the JSON
    const cleaned = text.replace(/```(?:json)?\n?/gi, "").trim();
    const categories: string[] = JSON.parse(cleaned);

    if (!Array.isArray(categories)) throw new Error("Unexpected AI response shape");

    const sanitized = categories
      .filter((c) => typeof c === "string" && c.trim())
      .map((c) => c.trim().slice(0, 50))
      .slice(0, 10);

    // Only cache non-empty results
    if (sanitized.length > 0) {
      cache.set(key, { categories: sanitized, ts: Date.now() });
    }
    return NextResponse.json({ categories: sanitized });
  } catch (err) {
    console.error("[AI suggest]", err);
    return NextResponse.json({ categories: [], error: "AI suggestion failed" }, { status: 500 });
  }
}
