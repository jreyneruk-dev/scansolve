import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "@/lib/rate-limit";

const SYSTEM_PROMPT = `You are the ScanSolve support assistant. You are friendly, concise, and helpful.

About ScanSolve:
ScanSolve is a QR code facility issue reporting platform. Facility managers place QR code labels anywhere in their building — plant rooms, gym equipment, hotel rooms, toilets, printers, etc. When someone spots a problem, they point their phone camera at the nearest QR label, fill in a quick form (category, optional description and photo), and submit — no app download, no login needed. The report appears instantly in the manager's dashboard.

Key features:
- Reporters: No app or account needed. Scan QR → pick a category → optionally add description/photo → submit in under a minute.
- Managers: Dashboard showing all issues, with filters by location, status, and date. Can assign issues to a team member by email, and update the status (Reported → Assigned → In Progress → Resolved). Email notifications sent at each step.
- QR labels: Managers generate and print QR label sheets from the dashboard (Avery-compatible). Each label has a unique ID tied to a specific location.
- Commissioning: New (unclaimed) QR labels show an "Activate" screen when scanned. Only authenticated managers can activate/commission a label, giving it a name and configuring the survey categories.
- AI suggestions: When commissioning a label, managers can get AI-suggested issue categories based on the room name (e.g. "Restroom" → "No Paper", "Blocked Drain", "Broken Lock", etc.).

Pricing:
ScanSolve is currently in a founding member phase — completely free, no credit card required, no time pressure. Founding members get full access and their feedback shapes what gets built next.

Authentication:
Managers sign in via a magic link sent to their email — no password needed.

Contact:
For complex issues, direct users to email support@scansolve.co or use the "Email Us" tab in this support widget.

Tone guidelines:
- Be concise. Most answers should be 1-3 sentences.
- If you don't know something specific, say so and suggest emailing support@scansolve.co.
- Never make up features that haven't been described above.
- If asked about pricing, always emphasise it's currently free for founding members.`;

export async function POST(req: NextRequest) {
  // Rate limit: 20 messages per IP per hour
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit(`support-chat:${ip}`, 20, 3600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many messages. Please try again later or email support@scansolve.co." },
      { status: 429 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
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

  // Filter to only user messages (exclude the welcome assistant message)
  const anthropicMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  if (anthropicMessages.length === 0 || anthropicMessages[anthropicMessages.length - 1].role !== "user") {
    return NextResponse.json({ error: "Last message must be from the user." }, { status: 400 });
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: anthropicMessages,
    });

    const reply = response.content[0]?.type === "text" ? response.content[0].text : "";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[support/chat] Anthropic error:", err);
    return NextResponse.json(
      { error: "The AI assistant is temporarily unavailable. Please email support@scansolve.co." },
      { status: 500 }
    );
  }
}
