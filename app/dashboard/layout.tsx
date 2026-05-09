import { requireAuth, getOrgForUser } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth("/dashboard");
  const org = await getOrgForUser(user.id);
  const orgNumber = (org as Record<string, unknown>)?.org_number as number | null ?? null;

  return (
    <div className="min-h-dvh">
      <DashboardNav userEmail={user.email ?? ""} orgNumber={orgNumber} />
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
