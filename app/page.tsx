import type { Metadata } from "next";
import Link from "next/link";
import { QrCode, Zap, ArrowRight, CheckCircle, BarChart3, MapPin, Sparkles } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://scansolve.co";

export const metadata: Metadata = {
  title: "ScanSolve — QR Code Facility Issue Reporting",
  description:
    "Place QR codes anywhere in your facility. Staff scan and report issues in seconds — no app or account needed. Managers get instant visibility and track every issue to resolution. Free for founding members.",
  alternates: {
    canonical: APP_URL,
  },
};

const videoJsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: "How ScanSolve Works — QR Code Facility Issue Reporting",
  description:
    "See how ScanSolve works: place a QR code at any location, staff scan to report issues instantly with no app or account needed, and managers track every issue through to resolution from one dashboard.",
  thumbnailUrl: `${APP_URL}/how-it-works-thumb.png`,
  uploadDate: "2025-05-24",
  contentUrl: `${APP_URL}/how-it-works.mp4`,
  embedUrl: APP_URL,
  duration: "PT1M",
  publisher: {
    "@type": "Organization",
    name: "ScanSolve",
    url: APP_URL,
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
      />
    <main className="min-h-dvh bg-slate-50 text-slate-900">

      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <QrCode className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">ScanSolve</span>
          </div>
          <Link
            href="/auth"
            className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Sign in <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-indigo-500 blur-xl opacity-40 animate-pulse-glow" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/30 animate-float">
              <QrCode className="h-9 w-9 text-white drop-shadow" />
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-600 mb-6">
          <Sparkles className="h-3 w-3" />
          Scan it. Solve it. Get stuff done.
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-tight mb-5">
          QR code facility reporting.<br />
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Issues fixed, not forgotten.
          </span>
        </h1>

        <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed mb-10">
          Place a QR code anywhere. Anyone can report an issue in seconds — no app download, no account needed. You get instant visibility and full control from day one.
        </p>

        <Link
          href="/auth?mode=signup"
          className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          Join as a Founding Member
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <p className="mt-4 text-xs text-slate-400">
          Free for your first year · No card required · No time pressure
        </p>
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section className="bg-white border-y border-slate-100 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest text-center mb-3">
            How it works
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-12">
            Up and running in under 10 minutes
          </h2>
          <div className="grid sm:grid-cols-3 gap-10">
            {[
              {
                step: "1",
                icon: QrCode,
                title: "Print your QR labels",
                body: "Generate labels in the dashboard and print them on standard Avery sheets. Peel and stick — anywhere an issue might arise.",
                color: "bg-indigo-50 text-indigo-500",
              },
              {
                step: "2",
                icon: MapPin,
                title: "Place them where problems happen",
                body: "Toilets, plant rooms, gym equipment, retail floors, train carriages. If something can go wrong there, put a label on it.",
                color: "bg-violet-50 text-violet-500",
              },
              {
                step: "3",
                icon: CheckCircle,
                title: "Issues get reported and resolved",
                body: "Anyone scans, fills a quick form, and the right person gets notified. Track it through to completion — all in one place.",
                color: "bg-emerald-50 text-emerald-500",
              },
            ].map(({ step, icon: Icon, title, body, color }) => (
              <div key={step} className="flex flex-col gap-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Step {step}</p>
                  <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Video demo */}
          <div className="mt-14">
            <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-slate-200/80 border border-slate-100 bg-slate-900">
              <video
                className="w-full"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
              >
                <source src="/how-it-works.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* ── Two perspectives ────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest text-center mb-3">
          Built for everyone on site
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-10">
          Two sides of the same problem.<br />One solution.
        </h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {/* Reporter */}
          <div className="rounded-3xl bg-white border border-slate-100 p-8 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 mb-5">
              <Zap className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">For people on site</p>
            <h3 className="text-xl font-bold text-slate-900 mb-3">"Finally, a way to get things fixed."</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Spot something broken? Scan the QR code on the wall, fill in a quick form, and optionally leave your email for updates. No app, no account, no chasing anyone. It&apos;s the fastest route from problem to solution.
            </p>
          </div>
          {/* Manager */}
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-8 shadow-lg shadow-indigo-500/20">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 mb-5">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-2">For managers</p>
            <h3 className="text-xl font-bold text-white mb-3">"Finally, I know what&apos;s actually happening."</h3>
            <p className="text-sm text-indigo-100 leading-relaxed">
              Know about every issue the moment it&apos;s reported — without doing a site tour. Assign it, track it, close it. Keep tenants happy, make costs visible, and protect your reputation before small problems become big ones.
            </p>
          </div>
        </div>
      </section>

      {/* ── Works everywhere ────────────────────────────────────────── */}
      <section className="bg-white border-y border-slate-100 py-14">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-3">
            Works everywhere
          </p>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            If you manage a site, ScanSolve is for you
          </h2>
          <p className="text-sm text-slate-500 mb-8 max-w-md mx-auto">
            One system for every type of venue. Especially powerful for multi-site groups who need consistent standards across locations.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "🏢 Offices", "🏋️ Gyms & Leisure", "🛍️ Retail", "🏨 Hotels",
              "🚂 Rail", "🏫 Schools", "🏗️ Serviced Offices", "🏘️ Residential Blocks", "🔧 FM Companies",
            ].map((label) => (
              <span
                key={label}
                className="px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Founding member CTA ─────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-600 mb-6">
          <Sparkles className="h-3 w-3" />
          Founding Member
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
          Get in early.<br />Shape what we build.
        </h2>
        <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
          ScanSolve is free for founding members — no card required, no time pressure. You&apos;re getting in at the start, and your feedback will directly shape the product.
        </p>
        <Link
          href="/auth?mode=signup"
          className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          Start Free — No Card Needed
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <p className="mt-4 text-xs text-slate-400">
          Free for your first year · No pressure · Help build something better
        </p>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600">
              <QrCode className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-slate-600">ScanSolve</span>
          </div>
          <p>© {new Date().getFullYear()} ScanSolve. All rights reserved.</p>
          <Link href="/auth" className="hover:text-slate-600 transition-colors">
            Manager Sign In →
          </Link>
        </div>
      </footer>

    </main>
    </>
  );
}
