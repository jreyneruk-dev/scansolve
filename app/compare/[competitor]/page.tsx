import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  QrCode,
  ArrowRight,
  Check,
  X,
  Sparkles,
  Zap,
  ChevronDown,
  Scale,
} from "lucide-react";
import { COMPARISONS, getComparison } from "@/lib/comparisons";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://scansolve.co";

interface PageProps {
  params: Promise<{ competitor: string }>;
}

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ competitor: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { competitor: slug } = await params;
  const c = getComparison(slug);
  if (!c) return {};
  const url = `${APP_URL}/compare/${c.slug}`;
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    keywords: [
      `ScanSolve vs ${c.competitor}`,
      `${c.competitor} alternative`,
      `${c.competitor} vs ScanSolve`,
      `cheaper ${c.competitor} alternative`,
      "QR fault reporting software",
    ],
    alternates: { canonical: url },
    openGraph: {
      title: `${c.metaTitle} | ScanSolve`,
      description: c.metaDescription,
      url,
      siteName: "ScanSolve",
      type: "website",
    },
  };
}

function Cell({ value, highlight }: { value: boolean | string; highlight?: boolean }) {
  if (typeof value === "string") {
    return <span className={`text-sm ${highlight ? "font-semibold text-slate-900" : "text-slate-600"}`}>{value}</span>;
  }
  if (value) return <Check className="mx-auto h-4 w-4 text-emerald-500" />;
  return <X className="mx-auto h-4 w-4 text-slate-300" />;
}

export default async function ComparePage({ params }: PageProps) {
  const { competitor: slug } = await params;
  const c = getComparison(slug);
  if (!c) notFound();

  const others = COMPARISONS.filter((o) => o.slug !== c.slug);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${APP_URL}/compare/${c.slug}/#faq`,
    mainEntity: c.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <main className="min-h-dvh bg-slate-50 text-slate-900">

        {/* Navbar */}
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
              <Link href="/auth" className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                Sign in <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-600 mb-5">
            <Scale className="h-3.5 w-3.5" />
            {c.eyebrow}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-tight mb-5 max-w-3xl mx-auto">
            {c.headline}
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed mb-9">{c.sub}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth?mode=signup"
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Start Free — No Card Needed
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold hover:border-indigo-300 hover:text-indigo-600 transition-all">
              See pricing
            </Link>
          </div>
        </section>

        {/* Pricing math band */}
        <section className="bg-gradient-to-br from-indigo-600 to-violet-700 py-12">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="text-xs font-semibold text-indigo-200 uppercase tracking-widest mb-4">{c.pricingMath.team}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/10 border border-white/15 p-5">
                <p className="text-xs font-semibold text-indigo-200 mb-1">{c.competitor}</p>
                <p className="text-white font-semibold leading-snug">{c.pricingMath.competitorCost}</p>
              </div>
              <div className="rounded-2xl bg-white p-5">
                <p className="text-xs font-semibold text-indigo-500 mb-1">ScanSolve</p>
                <p className="text-slate-900 font-semibold leading-snug">{c.pricingMath.scansolveCost}</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-indigo-200/90">{c.pricingLine}</p>
          </div>
        </section>

        {/* Comparison table */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest text-center mb-3">Side by side</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-10">ScanSolve vs {c.competitor}</h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-5 py-4 font-semibold text-slate-500 w-2/5">Feature</th>
                  <th className="text-center px-4 py-4 font-bold text-indigo-600 w-3/10 bg-indigo-50">ScanSolve</th>
                  <th className="text-center px-4 py-4 font-semibold text-slate-700 w-3/10">{c.competitor}</th>
                </tr>
              </thead>
              <tbody>
                {c.rows.map((row) => (
                  <tr key={row.feature} className="border-t border-slate-100 hover:bg-slate-50/40 transition-colors">
                    <td className="px-5 py-3.5 text-slate-600">{row.feature}</td>
                    <td className="px-4 py-3.5 text-center bg-indigo-50/50"><Cell value={row.scansolve} highlight /></td>
                    <td className="px-4 py-3.5 text-center"><Cell value={row.competitor} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Where the competitor is stronger (honest) */}
        <section className="bg-white border-y border-slate-100 py-16">
          <div className="max-w-3xl mx-auto px-6">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest text-center mb-3">Being straight with you</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-4">Where {c.competitor} is the stronger choice</h2>
            <p className="text-slate-500 text-center leading-relaxed mb-8">
              {c.competitor} is a full CMMS, and a good one. If maintenance is your core operation, it does things ScanSolve doesn&apos;t:
            </p>
            <ul className="space-y-3 max-w-xl mx-auto">
              {c.competitorStrengths.map((s) => (
                <li key={s} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-slate-600">{s}</span>
                </li>
              ))}
            </ul>
            <p className="text-slate-500 text-center leading-relaxed mt-8">
              If you&apos;ll use that depth, {c.competitor} is a solid pick. If you mainly need faults reported and tracked without a per-seat bill, read on.
            </p>
          </div>
        </section>

        {/* Where ScanSolve wins */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest text-center mb-3">Where ScanSolve wins</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-10">Leaner, flatter-priced, faster to start</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {c.scansolveWins.map((w) => (
              <div key={w.title} className="rounded-3xl bg-white border border-slate-100 p-7 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 mb-5">
                  <Zap className="h-5 w-5 text-indigo-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{w.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{w.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white border-y border-slate-100 py-16">
          <div className="max-w-3xl mx-auto px-6">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest text-center mb-3">FAQ</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-10">ScanSolve vs {c.competitor}: common questions</h2>
            <div className="divide-y divide-slate-100">
              {c.faqs.map(({ q, a }) => (
                <details key={q} className="group">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer py-5 list-none select-none">
                    <h3 className="text-base font-semibold text-slate-900 group-open:text-indigo-600 transition-colors">{q}</h3>
                    <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180 group-open:text-indigo-500" />
                  </summary>
                  <p className="pb-5 text-slate-500 leading-relaxed text-sm">{a}</p>
                </details>
              ))}
            </div>
            <p className="mt-8 text-xs text-slate-400 text-center leading-relaxed">
              {c.competitor} pricing and features as publicly listed, {c.asOf}; check {c.competitor}&apos;s own site for the latest.
              {" "}{c.competitor} is a trademark of its respective owner and is not affiliated with ScanSolve.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-600 mb-6">
            <Sparkles className="h-3 w-3" />
            Free forever on Starter
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Try the flat-price option.</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
            Start free with unlimited QR labels. No card, no per-seat bill. Upgrade to Prime when you want your own branding and instant alerts.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth?mode=signup"
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Start Free — No Card Needed
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold hover:border-indigo-300 hover:text-indigo-600 transition-all">
              See pricing
            </Link>
          </div>
        </section>

        {/* Other comparison */}
        {others.length > 0 && (
          <section className="bg-white border-t border-slate-100 py-14">
            <div className="max-w-5xl mx-auto px-6">
              <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest text-center mb-6">More comparisons</p>
              <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {others.map((o) => (
                  <Link
                    key={o.slug}
                    href={`/compare/${o.slug}`}
                    className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-5 hover:border-indigo-200 hover:bg-slate-50 transition-all"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 shrink-0">
                      <Scale className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">ScanSolve vs {o.competitor}</span>
                    <ArrowRight className="h-4 w-4 text-slate-300 ml-auto group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
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
