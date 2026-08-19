import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  QrCode,
  ArrowRight,
  MapPin,
  CheckCircle,
  Sparkles,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { VERTICALS, getVertical } from "@/lib/verticals";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://scansolve.co";

interface PageProps {
  params: Promise<{ vertical: string }>;
}

export function generateStaticParams() {
  return VERTICALS.map((v) => ({ vertical: v.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { vertical: slug } = await params;
  const v = getVertical(slug);
  if (!v) return {};
  const url = `${APP_URL}/for/${v.slug}`;
  return {
    title: v.metaTitle,
    description: v.metaDescription,
    keywords: v.seoKeywords,
    alternates: { canonical: url },
    openGraph: {
      title: `${v.metaTitle} | ScanSolve`,
      description: v.metaDescription,
      url,
      siteName: "ScanSolve",
      type: "website",
    },
  };
}

export default async function VerticalPage({ params }: PageProps) {
  const { vertical: slug } = await params;
  const v = getVertical(slug);
  if (!v) notFound();

  const Icon = v.icon;
  const others = VERTICALS.filter((o) => o.slug !== v.slug);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${APP_URL}/for/${v.slug}/#faq`,
    mainEntity: v.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <main className="min-h-dvh bg-slate-50 text-slate-900">

        {/* ── Navbar ──────────────────────────────────────────────────── */}
        <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
                <QrCode className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">ScanSolve</span>
            </Link>
            <div className="flex items-center gap-5">
              <Link href="/pricing" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Pricing</Link>
              <Link
                href="/auth"
                className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                Sign in <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </nav>

        {/* ── Hero ────────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 pt-16 pb-14 text-center">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-600 mb-5">
            <Icon className="h-3.5 w-3.5" />
            {v.eyebrow}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-tight mb-5 max-w-3xl mx-auto">
            {v.headline}
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed mb-9">
            {v.sub}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth?mode=signup"
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Start Free — No Card Needed
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            {v.secondaryCta.external ? (
              <a
                href={v.secondaryCta.href}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold hover:border-indigo-300 hover:text-indigo-600 transition-all"
              >
                {v.secondaryCta.label}
              </a>
            ) : (
              <Link
                href={v.secondaryCta.href}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold hover:border-indigo-300 hover:text-indigo-600 transition-all"
              >
                {v.secondaryCta.label}
              </Link>
            )}
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Unlimited QR labels on Starter · No card required · Written for {v.targetRole}
          </p>

          {v.heroImage && (
            <div className="mt-12 rounded-3xl overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.heroImage.src} alt={v.heroImage.alt} className="w-full h-auto" />
            </div>
          )}
        </section>

        {/* ── The problem ─────────────────────────────────────────────── */}
        <section className="bg-white border-y border-slate-100 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest text-center mb-3">
              The problem
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-4">
              {v.painTitle}
            </h2>
            <p className="text-slate-500 leading-relaxed text-center max-w-2xl mx-auto mb-12">
              {v.painIntro}
            </p>
            <div className="grid sm:grid-cols-3 gap-6">
              {v.pains.map((p) => (
                <div key={p.title} className="rounded-2xl bg-slate-50 border border-slate-100 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500 mb-4">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{p.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Proof stat ──────────────────────────────────────────────── */}
        {v.proofStat && (
          <section className="bg-gradient-to-br from-indigo-600 to-violet-700 py-14">
            <div className="max-w-3xl mx-auto px-6 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-white leading-snug mb-3">
                {v.proofStat.headline}
              </p>
              <p className="text-indigo-100 leading-relaxed max-w-xl mx-auto">
                {v.proofStat.sub}
              </p>
              {v.proofStat.source && (
                <p className="mt-4 text-xs text-indigo-200/80">Source: {v.proofStat.source}</p>
              )}
            </div>
          </section>
        )}

        {/* ── How ScanSolve fits ──────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-3">
                How ScanSolve fits
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                {v.hookTitle}
              </h2>
              <p className="text-slate-600 leading-relaxed">{v.hookBody}</p>
            </div>
            <div className="rounded-3xl bg-white border border-slate-100 p-7 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                What gets reported
              </p>
              <div className="flex flex-wrap gap-2">
                {v.exampleIssues.map((issue) => (
                  <span
                    key={issue}
                    className="px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700"
                  >
                    {issue}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Infographics ────────────────────────────────────────────── */}
        {v.infographics && v.infographics.length > 0 && (
          <section className="bg-white border-y border-slate-100 py-16">
            <div className="max-w-5xl mx-auto px-6">
              <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest text-center mb-3">
                See it in action
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-12">
                From a wall to a work order
              </h2>
              <div className={`grid gap-6 ${v.infographics.length > 1 ? "sm:grid-cols-2" : "max-w-2xl mx-auto"}`}>
                {v.infographics.map((g) => (
                  <figure key={g.src} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.src} alt={g.alt} className="w-full h-auto rounded-lg" />
                    {g.caption && (
                      <figcaption className="mt-3 text-sm text-slate-500 text-center">{g.caption}</figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Outcomes ────────────────────────────────────────────────── */}
        <section className="bg-white border-y border-slate-100 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest text-center mb-3">
              What changes
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-12">
              What you get out of it
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {v.outcomes.map((o) => (
                <div key={o.title} className="flex flex-col gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900">{o.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{o.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Competitor contrast ─────────────────────────────────────── */}
        {v.competitorContrast && (
          <section className="max-w-5xl mx-auto px-6 py-16">
            <div className="rounded-3xl bg-slate-900 p-8 sm:p-10 text-center">
              <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest mb-3">
                {v.competitorContrast.heading}
              </p>
              <p className="text-lg sm:text-xl text-white leading-relaxed max-w-2xl mx-auto">
                {v.competitorContrast.body}
              </p>
              <Link
                href="/pricing"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 hover:text-white transition-colors"
              >
                See how our pricing compares
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        )}

        {/* ── How it works (3 steps) ──────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 py-16">
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
                body: "Generate labels in the dashboard and print them on standard Avery sheets. Peel and stick.",
                color: "bg-indigo-50 text-indigo-500",
              },
              {
                step: "2",
                icon: MapPin,
                title: "Place them where faults happen",
                body: "One code per machine, room, or zone. If something can go wrong there, put a label on it.",
                color: "bg-violet-50 text-violet-500",
              },
              {
                step: "3",
                icon: CheckCircle,
                title: "Faults get reported and fixed",
                body: "Anyone scans, fills a quick form, and the right person gets notified. Track it through to done.",
                color: "bg-emerald-50 text-emerald-500",
              },
            ].map(({ step, icon: StepIcon, title, body, color }) => (
              <div key={step} className="flex flex-col gap-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${color}`}>
                  <StepIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Step {step}</p>
                  <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Video ───────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 pb-4">
          <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-xl shadow-slate-200/70 border border-slate-100 bg-slate-900">
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
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <section className="bg-white border-y border-slate-100 py-16">
          <div className="max-w-3xl mx-auto px-6">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest text-center mb-3">
              FAQ
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-10">
              {v.name}: common questions
            </h2>
            <div className="divide-y divide-slate-100">
              {v.faqs.map(({ q, a }) => (
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

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-600 mb-6">
            <Sparkles className="h-3 w-3" />
            Free forever on Starter
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Put a code where the fault is.
          </h2>
          <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
            Start free with unlimited QR labels. No card, no deadline. Upgrade to Prime when you want your own branding and instant alerts.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth?mode=signup"
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Start Free — No Card Needed
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold hover:border-indigo-300 hover:text-indigo-600 transition-all"
            >
              See pricing
            </Link>
          </div>
        </section>

        {/* ── Other industries ────────────────────────────────────────── */}
        <section className="bg-white border-t border-slate-100 py-14">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest text-center mb-6">
              Other industries
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {others.map((o) => {
                const OIcon = o.icon;
                return (
                  <Link
                    key={o.slug}
                    href={`/for/${o.slug}`}
                    className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-5 hover:border-indigo-200 hover:bg-slate-50 transition-all"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 shrink-0">
                      <OIcon className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{o.name}</span>
                    <ArrowRight className="h-4 w-4 text-slate-300 ml-auto group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer className="border-t border-slate-100 py-8">
          <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600">
                <QrCode className="h-3 w-3 text-white" />
              </div>
              <span className="font-semibold text-slate-600">ScanSolve</span>
            </Link>
            <p>© {new Date().getFullYear()} ScanSolve. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/about" className="hover:text-slate-600 transition-colors">About</Link>
              <Link href="/pricing" className="hover:text-slate-600 transition-colors">Pricing</Link>
              <Link href="/terms" className="hover:text-slate-600 transition-colors">Terms</Link>
            <Link href="/trust" className="hover:text-slate-600 transition-colors">Trust</Link>
            <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy</Link>
              <Link href="/auth" className="hover:text-slate-600 transition-colors">Manager Sign In →</Link>
            </div>
          </div>
        </footer>

      </main>
    </>
  );
}
