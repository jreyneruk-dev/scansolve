import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { getOrgForUser } from "@/lib/auth";
import { SHEET_TYPES } from "@/lib/labels";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrgForUser(user.id);
  if (!org) return NextResponse.json({ error: "No organisation found" }, { status: 403 });

  const orgId = (org as Record<string, unknown>).id as string;
  const service = getServiceClient();

  // Fetch print jobs for this org, join with auth.users for the email
  const { data, error } = await service
    .from("label_print_jobs")
    .select("*")
    .eq("org_id", orgId)
    .order("printed_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch user emails for each unique user_id
  const userIds = [...new Set((data ?? []).map((r: Record<string, unknown>) => r.user_id as string))];
  const emailMap: Record<string, string> = {};

  if (userIds.length > 0) {
    const { data: users } = await service.auth.admin.listUsers();
    if (users?.users) {
      for (const u of users.users) {
        if (userIds.includes(u.id)) emailMap[u.id] = u.email ?? u.id;
      }
    }
  }

  const jobs = (data ?? []).map((job: Record<string, unknown>) => ({
    id: job.id,
    sheetType: job.sheet_type,
    sheetTypeLabel: SHEET_TYPES[job.sheet_type as string]?.label ?? (job.sheet_type as string),
    sheets: job.sheets,
    quantityLabels: job.quantity_labels,
    uidStart: job.uid_start,
    uidEnd: job.uid_end,
    printedAt: job.printed_at,
    printedBy: emailMap[job.user_id as string] ?? (job.user_id as string),
  }));

  return NextResponse.json({ jobs });
}
