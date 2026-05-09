import Link from "next/link";
import { QrCode, ClipboardList, Zap, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-7">

        {/* Logo */}
        <div className="flex flex-col items-center space-y-4 animate-fade-up">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-indigo-500 blur-xl opacity-40 animate-pulse-glow" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/30 animate-float">
              <QrCode className="h-9 w-9 text-white drop-shadow" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">ScanSolve</h1>
            <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
              Scan any QR code to report a facilities issue instantly — no app needed.
            </p>
          </div>
        </div>

        {/* Feature cards */}
        <div className="flex flex-col gap-2.5 animate-fade-up-1">
          {[
            { icon: Zap, text: "Reporters scan & submit in seconds", color: "text-amber-500", bg: "bg-amber-50" },
            { icon: ClipboardList, text: "Managers track & assign from a dashboard", color: "text-indigo-500", bg: "bg-indigo-50" },
          ].map(({ icon: Icon, text, color, bg }) => (
            <div key={text} className="glass-card flex items-center gap-3.5 rounded-2xl px-4 py-3.5">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-4.5 w-4.5 ${color}`} />
              </div>
              <span className="text-sm font-medium text-slate-700">{text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-3 animate-fade-up-2">
          <Link
            href="/auth"
            className="group relative flex items-center justify-center w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 overflow-hidden"
          >
            <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200" />
            Manager Sign In
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <p className="text-center text-xs text-slate-400">
            Reporters: scan the QR code at your location to get started.
          </p>
        </div>

      </div>
    </main>
  );
}
