import { requireAuth, getOrgForUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { QrCode } from "lucide-react";
import { PostersClient } from "@/components/posters/PostersClient";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export default async function PostersPage() {
  const user = await requireAuth("/dashboard/posters");
  const org = await getOrgForUser(user.id);
  if (!org) redirect("/onboarding");

  const orgNumber = org.org_number as number;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Commissioned locations only — an uncommissioned UID shows the Activate
  // screen, so a poster for it would point at a dead code.
  const service = getServiceClient();
  const { data: locations } = await service
    .from("locations")
    .select("uid, name")
    .eq("org_id", org.id)
    .not("claimed_at", "is", null)
    .order("name", { ascending: true });

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
          <QrCode className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Scan-to-report posters</h1>
          <p className="text-sm text-slate-500">Print a large &ldquo;Scan to report an issue&rdquo; poster for any location — ideal for a pilot zone.</p>
        </div>
      </div>

      <PostersClient
        orgNumber={orgNumber}
        appUrl={appUrl}
        locations={(locations ?? []).map((l) => ({ uid: l.uid as string, name: l.name as string }))}
      />
    </div>
  );
}
