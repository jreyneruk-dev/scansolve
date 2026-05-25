"use client";
import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function CommissionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[commission page error]", error);
  }, [error]);

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-5 animate-slide-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 border border-red-100 shadow-lg">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <div className="glass-card rounded-3xl p-6 space-y-3">
          <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
          <p className="text-sm text-slate-500">
            We couldn&apos;t load this page. This is usually a temporary issue — please try again.
          </p>
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={reset}
              className="w-full min-h-[44px] rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200"
            >
              Try again
            </button>
            <a
              href="/dashboard"
              className="inline-block text-sm text-slate-400 hover:text-slate-600 transition-colors py-1"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
