import { headers } from "next/headers";
import { requireAuth, getOrgForUser } from "@/lib/auth";
import { isNativeUserAgent } from "@/lib/native";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { NativeProvider } from "@/components/native/NativeContext";
import { NativeBridge } from "@/components/native/NativeBridge";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth("/dashboard");
  const org = await getOrgForUser(user.id);
  const orgNumber = (org as Record<string, unknown>)?.org_number as number | null ?? null;
  const native = isNativeUserAgent((await headers()).get("user-agent"));

  return (
    <NativeProvider native={native}>
      <div className="min-h-dvh">
        <DashboardNav userEmail={user.email ?? ""} orgNumber={orgNumber} />
        {native && <NativeBridge />}
        <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
      </div>
    </NativeProvider>
  );
}
