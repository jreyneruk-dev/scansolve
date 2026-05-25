"use client";
import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function ScanError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[scan page error]", error);
  }, [error]);

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 border border-red-100 shadow-lg">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <div className="rounded-3xl bg-white/80 border border-slate-100 shadow-sm p-6 space-y-3">
          <h1 className="text-xl font-bold text-slate-900">Unable to load this page</h1>
          <p className="text-sm text-slate-500">
            This is usually a temporary issue. Please try again.
          </p>
          <button
            onClick={reset}
            className="w-full min-h-[44px] rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg transition-all duration-200"
          >
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}
