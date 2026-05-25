import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/server-env";
import { checkRateLimit } from "@/lib/rate-limit";

const SYSTEM_PROMPT = `You are the ScanSolve support assistant. You are friendly, concise, and helpful.

About ScanSolve:
ScanSolve is a QR code facility issue reporting platform. Facility managers place QR code labels anywhere in their building — plant rooms, gym equipment, hotel rooms, toilets, printers, etc. When someone spots a problem, they point their phone camera at the nearest QR label, fill in a quick form (category, optional description and photo), and submit — no app download, no login needed. The report appears instantly in the manager's dashboard.

Key features:
- Reporters: No app or account needed. Scan QR → pick a category → optionally add description/photo → submit in under a minute.
- Managers: Dashboard showing all issues, with filters by location, status, and date. Can assign issues to a team member by email, and update the status (Reported → Assigned → In Progress → Resolved). Email notifications sent at each step.
- QR labels: Managers generate and print QR label sheets from the dashboard (Avery-compatible). Each label has a unique ID tied to a specific location.
- Commissioning: New (unclaimed) QR labels show an "Activate" screen when scanned. Only authenticated managers can activate/commission a label, giving it a name and configuring the survey categories.
- AI suggestions: When commissioning a label, managers can get AI-suggested issue categories based on the room name.

Pricing:
ScanSolve is currently in a founding member phase — completely free, no credit card required, no time pressure. Founding members get full access and their feedback shapes what gets built next.

Authentication:
Managers sign in via a magic link sent to their email — no password needed.

Tone guidelines:
- Be concise. Most answers should be 1-3 sentences.
- If you do not know something specific, say so and suggest emailing support@scansolve.co.
- Never make up features not described above.`;

// Use Gemini 2.5 Flash via direct REST (most capable free model available)
const GEMINI_MODEL = "models/gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent`;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit(`support-chat:${ip}`, 20, 3600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many messages. Please try again later or email support@scansolve.co." },
      { status: 429 }
    );
  }

  const apiKey = getServerEnv("GOOGLE_AI_API_KEY");
  if (!apiKey) {
    return NextResponse.json({ error: "AI support is not configured." }, { status: 503 });
  }

  let body: { messages?: { role: string; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messages = body.messages ?? [];
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }

  // Build contents: only user/assistant, starting with a user turn
  const filtered = messages.filter((m) => m.role === "user" || m.role === "assistant");
  const startIdx = filtered.findIndex((m) => m.role === "user");
  if (startIdx === -1) {
    return NextResponse.json({ error: "No user message found." }, { status: 400 });
  }

  const contents = filtered.slice(startIdx).map((m, i) => {
    const role = m.role === "assistant" ? "model" : "user";
    // Inject system prompt into the very first user message
    const text = i === 0 && role === "user"
      ? `${SYSTEM_PROMPT}\n\n---\n\n${m.content}`
      : m.content;
    return { role, parts: [{ text }] };
  });

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[support/chat] Gemini error:", res.status, errText.slice(0, 300));
      return NextResponse.json(
        { error: "The AI assistant is temporarily unavailable. Please email support@scansolve.co." },
        { status: 500 }
      );
    }

    type GeminiResponse = {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const data = await res.json() as GeminiResponse;
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I could not generate a response.";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[support/chat] fetch error:", String(err).slice(0, 300));
    return NextResponse.json(
      { error: "The AI assistant is temporarily unavailable. Please email support@scansolve.co." },
      { status: 500 }
    );
  }
}
