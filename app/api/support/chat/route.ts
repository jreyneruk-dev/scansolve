import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
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

  const filtered = messages.filter((m) => m.role === "user" || m.role === "assistant");
  const startIdx = filtered.findIndex((m) => m.role === "user");
  if (startIdx === -1) {
    return NextResponse.json({ error: "No user message found." }, { status: 400 });
  }

  const contents = filtered.slice(startIdx).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel(
      { model: "gemini-1.5-flash" },
      { apiVersion: "v1" }
    );

    // Inject system prompt into first user message (v1 API workaround)
    const contentsWithSystem = contents.map((c, i) => {
      if (i === 0 && c.role === "user") {
        return {
          ...c,
          parts: [{ text: `${SYSTEM_PROMPT}\n\n---\n\nUser: ${c.parts[0].text}` }],
        };
      }
      return c;
    });

    const result = await model.generateContent({ contents: contentsWithSystem });
    const reply = result.response.text();
    return NextResponse.json({ reply });
  } catch (err) {
    const msg = String(err).slice(0, 400);
    console.error("[support/chat] Gemini error:", msg);
    return NextResponse.json({ error: "DEBUG4: " + msg }, { status: 500 });
  }
}
