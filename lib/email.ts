import { Resend } from "resend";

const FROM = process.env.FROM_EMAIL ?? "noreply@qr-issue-tracker.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  return new Resend(key);
}

export async function sendIssueAssignmentEmail(params: {
  to: string;
  issueId: string;
  locationName: string;
  category: string;
  description?: string;
}) {
  const { to, issueId, locationName, category, description } = params;
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `New issue assigned: ${category} at ${locationName}`,
    html: `
      <h2>You have been assigned a new issue</h2>
      <p><strong>Location:</strong> ${locationName}</p>
      <p><strong>Category:</strong> ${category}</p>
      ${description ? `<p><strong>Description:</strong> ${description}</p>` : ""}
      <p>
        <a href="${APP_URL}/dashboard/issues/${issueId}" style="
          display:inline-block;padding:10px 20px;background:#0f172a;
          color:#fff;text-decoration:none;border-radius:6px;">
          View Issue
        </a>
      </p>
    `,
  });
}

export async function sendInviteEmail(params: {
  to: string;
  orgName: string;
  invitedBy: string;
  token: string;
}) {
  const { to, orgName, invitedBy, token } = params;
  const link = `${APP_URL}/invite/${token}`;
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `You've been invited to join ${orgName} on ScanSolve`,
    html: `
      <h2>You've been invited</h2>
      <p><strong>${invitedBy}</strong> has invited you to join <strong>${orgName}</strong> on ScanSolve.</p>
      <p>
        <a href="${link}" style="
          display:inline-block;padding:10px 20px;background:#4f46e5;
          color:#fff;text-decoration:none;border-radius:6px;">
          Accept Invitation
        </a>
      </p>
      <p style="color:#64748b;font-size:12px;">This link expires in 7 days. If you did not expect this invitation, you can ignore this email.</p>
    `,
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
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Issue status updated: ${category} at ${locationName}`,
    html: `
      <h2>Issue Status Updated</h2>
      <p><strong>Location:</strong> ${locationName}</p>
      <p><strong>Category:</strong> ${category}</p>
      <p><strong>New Status:</strong> ${newStatus.replace("_", " ")}</p>
      <p>
        <a href="${APP_URL}/dashboard/issues/${issueId}" style="
          display:inline-block;padding:10px 20px;background:#0f172a;
          color:#fff;text-decoration:none;border-radius:6px;">
          View Issue
        </a>
      </p>
    `,
  });
}
