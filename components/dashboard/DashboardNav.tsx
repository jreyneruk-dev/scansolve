"use client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Settings, Tag } from "lucide-react";
import { ScanSolveLogo } from "@/components/ui/ScanSolveLogo";

interface DashboardNavProps {
  userEmail: string;
  orgNumber?: number | null;
}

export function DashboardNav({ userEmail, orgNumber }: DashboardNavProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
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

          <Link
            href="/dashboard/labels"
            className="flex items-center gap-1.5 min-h-[36px] px-3 text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-xl transition-all duration-150"
          >
            <Tag className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Labels</span>
          </Link>

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
    </header>
  );
}
