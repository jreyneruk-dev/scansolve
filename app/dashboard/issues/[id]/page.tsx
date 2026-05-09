import { requireAuth, getOrgForUser } from "@/lib/auth";
import { getAdapter } from "@/lib/db";
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

  return <IssueDetail issue={issue} />;
}
