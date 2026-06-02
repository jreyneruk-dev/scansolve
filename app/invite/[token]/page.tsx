import Link from "next/link";
import { AcceptInviteForm } from "@/components/invite/AcceptInviteForm";
import { QrCode } from "lucide-react";

interface PageProps {
  params: Promise<{ token: string }>;
}

async function getInviteDetails(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/invites/${token}`, { cache: "no-store" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { error: (data.error as string) ?? "Invalid invite link" };
  }
  return res.json() as Promise<{ email: string; orgName: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;
  const result = await getInviteDetails(token);

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-5 animate-slide-in">
        <div className="text-center space-y-3">
          <div className="relative mx-auto w-fit">
            <div className="absolute inset-0 rounded-3xl bg-indigo-500 blur-xl opacity-35 animate-pulse-glow" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/30">
              <QrCode className="h-8 w-8 text-white" />
            </div>
          </div>
          {"error" in result ? (
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-slate-900">Invite unavailable</h1>
              <p className="text-sm text-slate-500">{result.error}</p>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-slate-900">You&apos;ve been invited</h1>
              <p className="mt-1 text-sm text-slate-500">
                Join <strong className="text-slate-700">{result.orgName}</strong> on ScanSolve
              </p>
            </div>
          )}
        </div>

        {"error" in result ? (
          <div className="text-center">
            <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors">Go to home</Link>
          </div>
        ) : (
          <AcceptInviteForm token={token} orgName={result.orgName} inviteEmail={result.email} />
        )}
      </div>
    </main>
  );
}
