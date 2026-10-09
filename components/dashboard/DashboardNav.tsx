"use client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { LogOut, Settings, Tag, CreditCard, BarChart3, ScanLine } from "lucide-react";
import { ScanSolveLogo } from "@/components/ui/ScanSolveLogo";
import { useIsNative } from "@/components/native/NativeContext";

interface DashboardNavProps {
  userEmail: string;
  orgNumber?: number | null;
}

export function DashboardNav({ userEmail, orgNumber }: DashboardNavProps) {
  const router = useRouter();
  const native = useIsNative();
  const [scanError, setScanError] = useState<string | null>(null);

  async function scan() {
    setScanError(null);
    try {
      const { scanLabel } = await import("@/lib/native-scan");
      const path = await scanLabel();
      if (path) router.push(path);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Couldn't scan that label.");
    }
  }
  const supabase = createSupabaseBrowserClient();

  async function signOut() {
    if (native) await (await import("@/lib/native-push")).unregisterNativePush();
    await supabase.auth.signOut();
    router.push(native ? "/auth" : "/");
    router.refresh();
  }

  return (
    <header className="glass-nav sticky top-0 z-20">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo + org number */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="group">
            <ScanSolveLogo size="sm" className="group-hover:opacity-90 transition-opacity" />
          </Link>
          {orgNumber != null && (
            <span className="hidden sm:inline-block text-xs text-slate-400 font-mono">
              Org #{orgNumber}
            </span>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400 hidden sm:block mr-2">{userEmail}</span>

          {native && (
            <button
              onClick={scan}
              aria-label="Scan a label"
              className="flex items-center gap-1.5 min-h-[44px] min-w-[44px] justify-center px-3 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all duration-150"
            >
              <ScanLine className="h-4 w-4" />
              <span className="hidden sm:inline">Scan</span>
            </button>
          )}

          <Link
            href="/dashboard/labels"
            className="flex items-center gap-1.5 min-h-[36px] px-3 text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-xl transition-all duration-150"
          >
            <Tag className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Labels</span>
          </Link>

          <Link
            href="/dashboard/insights"
            className="flex items-center gap-1.5 min-h-[36px] px-3 text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-xl transition-all duration-150"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Insights</span>
          </Link>

          {!native && <Link
            href="/dashboard/billing"
            className="flex items-center gap-1.5 min-h-[36px] px-3 text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-xl transition-all duration-150"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Billing</span>
          </Link>}

          <Link
            href="/dashboard/settings"
            className="flex items-center gap-1.5 min-h-[36px] px-3 text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-xl transition-all duration-150"
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </Link>

          <button
            onClick={signOut}
            className="flex items-center gap-1.5 min-h-[36px] px-3 text-xs font-medium text-slate-500 hover:text-red-500 hover:bg-red-50/70 rounded-xl transition-all duration-150"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
      {scanError && (
        <button onClick={() => setScanError(null)} className="block w-full bg-red-50 border-t border-red-100 px-4 py-2 text-left text-xs text-red-700">
          {scanError}
        </button>
      )}
    </header>
  );
}
