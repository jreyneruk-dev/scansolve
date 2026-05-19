import { requireAuth, getOrgForUser } from "@/lib/auth";
import { getAdapter } from "@/lib/db";
import { refreshPhotoUrl } from "@/lib/storage";
import { notFound } from "next/navigation";
import { IssueDetail } from "@/components/dashboard/IssueDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function IssuePage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireAuth(`/dashboard/issues/${id}`);
  const org = await getOrgForUser(user.id);
  if (!org) notFound();

  const adapter = await getAdapter(org.id);
  const issue = await adapter.getIssueById(id, org.id);
  if (!issue) notFound();

  // Refresh the signed URL on every page load — signed URLs expire after 1 year
  // but any URLs stored before that change were set to 7 days and may be expired.
  if (issue.photo_url) {
    issue.photo_url = await refreshPhotoUrl(issue.photo_url);
  }

  return <IssueDetail issue={issue} />;
}
