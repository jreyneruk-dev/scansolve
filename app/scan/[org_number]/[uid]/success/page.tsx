import { CheckCircle2 } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ message?: string }>;
}

export default async function ScanSuccessPage({ searchParams }: PageProps) {
  const { message } = await searchParams;

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-5 animate-slide-in">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-2xl shadow-emerald-500/30">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
        <div className="glass-card rounded-3xl p-6 space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Issue Reported</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            {message ?? "Thank you! We'll look into this shortly."}
          </p>
        </div>
        <p className="text-xs text-slate-400">You can now close this page.</p>
      </div>
    </main>
  );
}
