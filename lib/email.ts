import { Resend } from "resend";
import { escapeHtml } from "@/lib/sanitize";

const FROM = process.env.FROM_EMAIL ?? "noreply@scansolve.co";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://scansolve.co";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  return new Resend(key);
}

/** Shared email wrapper — consistent brand, padding, footer */
function wrapEmail(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:20px 28px;">
            <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">ScanSolve</span>
          </td>
        </tr>
        <tr><td style="padding:28px;">${bodyHtml}</td></tr>
        <tr>
          <td style="padding:16px 28px;border-top:1px solid #f1f5f9;background:#f8fafc;">
            <p style="margin:0;font-size:11px;color:#94a3b8;">
              This email was sent by ScanSolve — <a href="${APP_URL}" style="color:#6366f1;">scansolve.co</a>.
              Do not reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendIssueAssignmentEmail(params: {
  to: string;
  issueId: string;
  locationName: string;
  category: string;
  description?: string;
}) {
  const { to, issueId, locationName, category, description } = params;

  // Escape all user-supplied data before embedding in HTML
  const safeLocation = escapeHtml(locationName);
  const safeCategory = escapeHtml(category);
  const safeDescription = description ? escapeHtml(description) : null;

  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#0f172a;">New issue assigned to you</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;width:100px;vertical-align:top;">Location</td>
        <td style="padding:8px 0;color:#0f172a;font-size:14px;">${safeLocation}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;vertical-align:top;">Category</td>
        <td style="padding:8px 0;color:#0f172a;font-size:14px;">${safeCategory}</td>
      </tr>
      ${safeDescription ? `
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;vertical-align:top;">Description</td>
        <td style="padding:8px 0;color:#0f172a;font-size:14px;">${safeDescription}</td>
      </tr>` : ""}
    </table>
    <div style="margin-top:24px;">
      <a href="${APP_URL}/dashboard/issues/${encodeURIComponent(issueId)}"
         style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#ffffff;
                text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
        View Issue
      </a>
    </div>`;

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `New issue assigned: ${safeCategory} at ${safeLocation}`,
    html: wrapEmail(body),
  });
}

export async function sendInviteEmail(params: {
  to: string;
  orgName: string;
  invitedBy: string;
  token: string;
}) {
  const { to, orgName, invitedBy, token } = params;

  const safeOrg = escapeHtml(orgName);
  const safeInvitedBy = escapeHtml(invitedBy);
  const link = `${APP_URL}/invite/${encodeURIComponent(token)}`;

  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#0f172a;">You've been invited</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">
      <strong>${safeInvitedBy}</strong> has invited you to join <strong>${safeOrg}</strong> on ScanSolve.
    </p>
    <div style="margin-top:24px;">
      <a href="${link}"
         style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#ffffff;
                text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
        Accept Invitation
      </a>
    </div>
    <p style="margin-top:20px;font-size:12px;color:#94a3b8;">
      This link expires in 7 days. If you did not expect this invitation, ignore this email.
    </p>`;

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `You've been invited to join ${safeOrg} on ScanSolve`,
    html: wrapEmail(body),
  });
}

export async function sendRecoveryCodeEmail(params: {
  to: string;
  primaryEmail: string;
  otp: string;
  magicLink: string;
}) {
  const { to, primaryEmail, otp, magicLink } = params;

  const safePrimary = escapeHtml(primaryEmail);
  const safeOtp = escapeHtml(otp);

  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#0f172a;">Your sign-in code</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">
      A sign-in request was made for <strong>${safePrimary}</strong>. Use the code or
      button below to access your account.
    </p>
    <div style="margin:0 0 24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;text-align:center;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;">8-digit code</p>
      <p style="margin:0;font-size:32px;font-weight:700;color:#0f172a;letter-spacing:0.25em;font-family:monospace;">${safeOtp}</p>
    </div>
    <div style="margin-bottom:24px;text-align:center;">
      <a href="${encodeURI(magicLink)}"
         style="display:inline-block;padding:12px 28px;background:#4f46e5;color:#ffffff;
                text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
        Sign In Directly
      </a>
    </div>
    <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
      This code expires in 60 minutes. If you did not request this, you can safely ignore
      this email — your account remains secure.
    </p>`;

  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Your ScanSolve sign-in code",
    html: wrapEmail(body),
  });
}

export async function sendStatusUpdateEmail(params: {
  to: string;
  issueId: string;
  locationName: string;
  category: string;
  newStatus: string;
}) {
  const { to, issueId, locationName, category, newStatus } = params;

  const safeLocation = escapeHtml(locationName);
  const safeCategory = escapeHtml(category);
  // Status comes from a server enum — still escape defensively
  const safeStatus = escapeHtml(newStatus.replace(/_/g, " "));

  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#0f172a;">Issue status updated</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;width:100px;">Location</td>
        <td style="padding:8px 0;color:#0f172a;font-size:14px;">${safeLocation}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;">Category</td>
        <td style="padding:8px 0;color:#0f172a;font-size:14px;">${safeCategory}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;">New Status</td>
        <td style="padding:8px 0;color:#0f172a;font-size:14px;text-transform:capitalize;">${safeStatus}</td>
      </tr>
    </table>
    <div style="margin-top:24px;">
      <a href="${APP_URL}/dashboard/issues/${encodeURIComponent(issueId)}"
         style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#ffffff;
                text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
        View Issue
      </a>
    </div>`;

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Issue status updated: ${safeCategory} at ${safeLocation}`,
    html: wrapEmail(body),
  });
}
