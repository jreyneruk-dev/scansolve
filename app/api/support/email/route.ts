import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email required"),
  message: z.string().min(10, "Message too short").max(2000, "Message too long (max 2000 chars)"),
});

export async function POST(req: NextRequest) {
  // Rate limit: 3 emails per IP per hour
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit(`support-email:${ip}`, 3, 3600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const { name, email, message } = parsed.data;

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "Email service not configured." }, { status: 503 });
  }

  try {
    const resend = new Resend(resendKey);
    const from = process.env.FROM_EMAIL ?? "noreply@scansolve.co";

    await resend.emails.send({
      from,
      to: "support@scansolve.co",
      replyTo: email,
      subject: `Support request from ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#0f172a;">New Support Request</h2>
          <table style="border-collapse:collapse;width:100%;">
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:14px;width:80px;">Name</td>
              <td style="padding:8px 0;color:#0f172a;font-size:14px;">${name}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:14px;">Email</td>
              <td style="padding:8px 0;color:#0f172a;font-size:14px;">
                <a href="mailto:${email}" style="color:#4f46e5;">${email}</a>
              </td>
            </tr>
          </table>
          <div style="margin-top:16px;padding:16px;background:#f8fafc;border-radius:8px;border-left:4px solid #4f46e5;">
            <p style="margin:0;color:#0f172a;font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</p>
          </div>
          <p style="margin-top:16px;font-size:12px;color:#94a3b8;">
            Sent via the ScanSolve support widget. Reply directly to this email to respond to ${name}.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[support/email] Resend error:", err);
    return NextResponse.json(
      { error: "Failed to send message. Please email support@scansolve.co directly." },
      { status: 500 }
    );
  }
}
