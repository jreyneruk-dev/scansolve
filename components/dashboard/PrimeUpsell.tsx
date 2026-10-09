"use client";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { useIsNative } from "@/components/native/NativeContext";

interface Props {
  heading: string;
  intro: string;
  title: string;
  blurb: string;
}

/**
 * Settings card for a Prime-only section on a free plan. Renders nothing in
 * the store apps, which must not point to purchases outside the app (Apple 3.1.1).
 */
export function PrimeUpsell({ heading, intro, title, blurb }: Props) {
  if (useIsNative()) return null;
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-700 mb-1">{heading}</h2>
      <p className="text-xs text-slate-400 mb-4">{intro}</p>
      <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 p-5 flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-indigo-100 shadow-sm">
          <Sparkles className="h-4 w-4 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{blurb}</p>
        </div>
        <Link href="/pricing" className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors">
          Upgrade <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
