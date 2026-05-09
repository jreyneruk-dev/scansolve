import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdapter } from "@/lib/db";
import { getOrgForUser } from "@/lib/auth";
import { sendIssueAssignmentEmail, sendStatusUpdateEmail } from "@/lib/email";
import { z } from "zod";
import type { IssueStatus } from "@/types/schema";

const UpdateIssueSchema = z.object({
  status: z.enum(["reported", "assigned", "in_progress", "resolved"]).optional(),
  assigned_to: z.string().optional(),
});

const VALID_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  reported: ["assigned"],
  assigned: ["in_progress", "resolved", "reported"],
  in_progress: ["resolved", "assigned"],
  resolved: ["assigned"],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrgForUser(user.id);
  if (!org) return NextResponse.json({ error: "No organization found" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateIssueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  if (parsed.data.assigned_to && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed.data.assigned_to)) {
    return NextResponse.json({ error: "assigned_to must be a valid email" }, { status: 422 });
  }

  const adapter = await getAdapter(org.id);
  const existing = await adapter.getIssueById(id, org.id);
  if (!existing) return NextResponse.json({ error: "Issue not found" }, { status: 404 });

  if (parsed.data.status && parsed.data.status !== existing.status) {
    const allowed = VALID_TRANSITIONS[existing.status as IssueStatus];
    if (!allowed.includes(parsed.data.status as IssueStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from ${existing.status} to ${parsed.data.status}` },
        { status: 422 }
      );
    }
    if (parsed.data.status === "assigned" && !parsed.data.assigned_to && !existing.assigned_to) {
      return NextResponse.json(
        { error: "assigned_to email required when assigning" },
        { status: 422 }
      );
    }
  }

  const updated = await adapter.updateIssue(id, org.id, parsed.data);

  const locationName = existing.location?.name ?? "Unknown location";
  if (parsed.data.status === "assigned" && parsed.data.assigned_to) {
    sendIssueAssignmentEmail({
      to: parsed.data.assigned_to,
      issueId: id,
      locationName,
      category: existing.category,
      description: existing.description,
    }).catch(console.error);
  } else if (parsed.data.status && existing.assigned_to) {
    sendStatusUpdateEmail({
      to: existing.assigned_to,
      issueId: id,
      locationName,
      category: existing.category,
      newStatus: parsed.data.status,
    }).catch(console.error);
  }

  return NextResponse.json(updated);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrgForUser(user.id);
  if (!org) return NextResponse.json({ error: "No organization found" }, { status: 403 });

  const adapter = await getAdapter(org.id);
  const issue = await adapter.getIssueById(id, org.id);
  if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });

  return NextResponse.json(issue);
}
