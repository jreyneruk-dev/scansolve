import type { Metadata } from "next";
import Link from "next/link";
import { QrCode, Zap, ArrowRight, CheckCircle, BarChart3, MapPin, Sparkles, ChevronDown } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://scansolve.co";

export const metadata: Metadata = {
  title: "ScanSolve — QR Code Facility Issue Reporting",
  description:
    "Place QR codes anywhere. Staff scan to report issues in seconds — no app or login needed. Managers track every issue to resolution. Free for founding members.",
  alternates: {
    canonical: APP_URL,
  },
};

const homepageJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "VideoObject",
      "@id": `${APP_URL}/#video-how-it-works`,
      name: "How ScanSolve Works — QR Code Facility Issue Reporting",
      description:
        "See how ScanSolve works: place a QR code at any location, staff scan to report issues instantly with no app or account needed, and managers track every issue through to resolution from one dashboard.",
      thumbnailUrl: `${APP_URL}/how-it-works-thumb.png`,
      uploadDate: "2026-05-24",
      contentUrl: `${APP_URL}/how-it-works.mp4`,
      duration: "PT1M",
      publisher: { "@id": `${APP_URL}/#organization` },
    },
    {
      "@type": "FAQPage",
      "@id": `${APP_URL}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "What is ScanSolve?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "ScanSolve is a QR code facility issue reporting tool. Facility managers generate and print QR code labels, place them at locations around their building, and anyone on site can scan a label to report a maintenance issue — no app download or account required. Managers receive real-time notifications and track every report from open to resolved in one dashboard.",
          },
        },
        {
          "@type": "Question",
          name: "How does ScanSolve work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "ScanSolve works in three steps. First, a facility manager signs up, creates their locations, and prints QR code labels from the dashboard onto standard Avery label sheets. Second, those labels are placed on walls, equipment, or doors at locations where issues might arise. Third, when someone spots a problem — a leak, broken equipment, a cleaning issue — they scan the label with their phone camera, fill in a short form, and submit. The report appears instantly in the manager's dashboard.",
          },
        },
        {
          "@type": "Question",
          name: "Does ScanSolve require an app download?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. ScanSolve requires no app download and no account for the person reporting the issue. The reporter simply scans the QR code label with their phone's built-in camera, which opens a web page. They fill in a short form and submit. The whole process takes under a minute. Only the facility manager needs an account.",
          },
        },
        {
          "@type": "Question",
          name: "What types of facilities use ScanSolve?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "ScanSolve is used by offices, gyms and leisure centres, hotels and serviced accommodation, retail stores, schools, railway carriages and stations, serviced offices, residential apartment blocks, and facilities management companies overseeing multiple sites.",
          },
        },
        {
          "@type": "Question",
          name: "Is ScanSolve free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "ScanSolve is currently free for founding members — no credit card required and no time pressure. Founding members get full access during the early access period and their feedback directly shapes the product roadmap.",
          },
        },
        {
          "@type": "Question",
          name: "What happens after an issue is reported?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Once an issue is submitted via a ScanSolve QR code, it appears immediately in the facility manager's dashboard with the location, category, description, and any photo attached. The manager can assign the issue to a team member, update the status through Assigned, In Progress, and Resolved stages, and receive email notifications at each step.",
          },
        },
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageJsonLd) }}
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
          ScanSolve — QR code facility reporting.<br />
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Issues fixed, not forgotten.
          </span>
        </h1>

        <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed mb-10">
          Place a ScanSolve QR code anywhere. Anyone can scan and solve facility problems in seconds — no app download, no account needed. You get instant visibility and full control from day one.
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
                className="w-full aspect-video"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                poster="/how-it-works-thumb.png"
                aria-label="ScanSolve product walkthrough — QR code facility issue reporting"
              >
                <source src="/how-it-works.mp4" type="video/mp4" />
              </video>
            </div>
            <p className="sr-only">
              The video above shows the full ScanSolve workflow. A facilities manager logs into the dashboard, generates QR code labels, and prints them on standard Avery sheets. A member of staff scans a label on their phone camera — no app needed — and fills in a short issue report form. The manager instantly receives the report, assigns it to a team member, and tracks it through to resolution, all from a single dashboard. No specialist software, no complicated setup.
            </p>
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
            <h3 className="text-xl font-bold text-slate-900 mb-3">&ldquo;Finally, a way to get things fixed.&rdquo;</h3>
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
            <h3 className="text-xl font-bold text-white mb-3">&ldquo;Finally, I know what&apos;s actually happening.&rdquo;</h3>
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

      {/* ── About ScanSolve ─────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest text-center mb-3">
          About ScanSolve
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-8">
          Built to close the gap between a problem spotted<br className="hidden sm:block" /> and a problem solved
        </h2>
        <div className="max-w-3xl mx-auto">
          <p className="text-slate-600 leading-relaxed">
            ScanSolve is a web-based facility issue reporting platform built around QR codes. Founded in 2025, ScanSolve was created to eliminate the gap between a problem being spotted and a manager knowing about it. Traditional reporting relies on phone calls, paper sheets, or people remembering to log something — all of which are slow, inconsistent, and easy to miss.
          </p>
          <details className="group mt-4">
            <summary className="inline-flex items-center gap-1 cursor-pointer text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors list-none select-none">
              <span className="group-open:hidden">Read more</span>
              <span className="hidden group-open:inline">Show less</span>
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-4 space-y-4 text-slate-600 leading-relaxed">
              <p>
                With ScanSolve, facility managers print QR code labels and place them anywhere a problem might occur — a plant room, a gym machine, a hotel corridor, a school toilet block, a retail shop floor. When someone notices an issue, they point their phone camera at the nearest label. No app to download. No account to create. They fill in a short form — selecting a category, optionally adding a description or photo — and submit. The manager sees it instantly in their dashboard.
              </p>
              <p>
                If you&apos;ve ever searched for a way to scan and solve facility problems without expensive specialist software or complicated setup, ScanSolve was built exactly for that. Every issue is tracked from first report through to resolution, with assignment, status updates, and email notifications built in. ScanSolve is designed for facilities managers, property teams, FM companies, hotel operations, school site managers, and anyone responsible for keeping a site running. Founding membership is free.
              </p>
            </div>
          </details>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-slate-100 py-16">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest text-center mb-3">
            FAQ
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-10">
            Frequently asked questions
          </h2>
          <div className="divide-y divide-slate-100">
            {[
              {
                q: "What is ScanSolve?",
                a: "ScanSolve is a QR code facility issue reporting tool. Facility managers generate and print QR code labels, place them at locations around their building, and anyone on site can scan a label to report a maintenance issue — no app download or account required. Managers receive real-time notifications and track every report from open to resolved in one dashboard. ScanSolve works for offices, gyms, hotels, schools, retail premises, residential blocks, and any site where maintenance issues need to be logged and resolved.",
              },
              {
                q: "How does ScanSolve work?",
                a: "ScanSolve works in three steps. First, a facility manager signs up, creates their locations, and prints QR code labels from the dashboard onto standard Avery label sheets. Second, those labels are placed on walls, equipment, or doors at locations where issues might arise. Third, when someone spots a problem — a leak, broken equipment, a cleaning issue — they scan the label with their phone camera, fill in a short form, and submit. The report appears instantly in the manager's dashboard, where it can be assigned to a team member and tracked through to completion.",
              },
              {
                q: "Does ScanSolve require an app download?",
                a: "No. ScanSolve requires no app download and no account for the person reporting the issue. The reporter simply scans the QR code label with their phone's built-in camera, which opens a web page. They fill in a short form and submit. The whole process takes under a minute. Only the facility manager needs an account, which they use to access the dashboard, manage locations, and track issues.",
              },
              {
                q: "What types of facilities use ScanSolve?",
                a: "ScanSolve is used by a wide range of facilities: office buildings, gyms and leisure centres, hotels and serviced accommodation, retail stores, schools and educational facilities, railway carriages and stations, serviced offices, residential apartment blocks, and facilities management companies overseeing multiple sites. Any location where maintenance issues need to be reported quickly and tracked to resolution is a good fit for ScanSolve.",
              },
              {
                q: "Is ScanSolve free?",
                a: "ScanSolve is currently free for founding members — no credit card required and no time pressure. Founding members get full access during the early access period and their feedback directly shapes the product roadmap. Sign up at scansolve.co to claim your founding membership.",
              },
              {
                q: "What happens after an issue is reported?",
                a: "Once an issue is submitted via a ScanSolve QR code, it appears immediately in the facility manager's dashboard with the location, category, description, and any photo the reporter attached. The manager can assign the issue to a specific team member by email, update the status through Assigned, In Progress, and Resolved stages, and receive email notifications at each step. The reporter can optionally provide their email address to receive a confirmation and updates.",
              },
            ].map(({ q, a }) => (
              <details key={q} className="group">
                <summary className="flex items-center justify-between gap-4 cursor-pointer py-5 list-none select-none">
                  <h3 className="text-base font-semibold text-slate-900 group-open:text-indigo-600 transition-colors">{q}</h3>
                  <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180 group-open:text-indigo-500" />
                </summary>
                <p className="pb-5 text-slate-500 leading-relaxed text-sm">{a}</p>
              </details>
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
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600">
              <QrCode className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-slate-600">ScanSolve</span>
          </div>
          <p>© {new Date().getFullYear()} ScanSolve. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-slate-600 transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
            <Link href="/auth" className="hover:text-slate-600 transition-colors">Manager Sign In →</Link>
          </div>
        </div>
      </footer>

    </main>
    </>
  );
}
