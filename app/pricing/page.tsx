import type { Metadata } from "next";
import Link from "next/link";
import { PrimeCtaButton } from "@/components/pricing/PrimeCtaButton";
import {
  QrCode,
  ArrowRight,
  Check,
  X,
  Sparkles,
  Zap,
  Building2,
  MessageSquare,
  Users,
  Bell,
  Layers,
  BarChart3,
  Shield,
} from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://scansolve.co";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Flat price, no per-seat tax. Start free with unlimited QR labels; Prime adds your own logo, a bigger team, and instant alerts when a maintenance issue is reported.",
  alternates: {
    canonical: `${APP_URL}/pricing`,
  },
  openGraph: {
    title: "ScanSolve pricing — flat price, no per-seat tax",
    description:
      "Start free with unlimited QR labels. Prime is one flat price for the whole team — no per-user bill.",
    url: `${APP_URL}/pricing`,
    siteName: "ScanSolve",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ScanSolve" }],
  },
};

// ── Tier definitions ────────────────────────────────────────────────────────

interface Feature {
  label: string;
  note?: string;
  highlight?: boolean;
}

interface Tier {
  name: string;
  badge: string | null;
  tagline: string;
  priceLabel: string;
  priceSub: string;
  description: string;
  cta: { label: string; href: string; external?: boolean };
  features: Feature[];
  notIncluded: string[];
  isPrimary?: boolean;
}

const tiers: Tier[] = [
  {
    name: "Starter",
    badge: null,
    tagline: "Free forever",
    priceLabel: "Free",
    priceSub: "No card required · No time limit",
    description:
      "Everything you need to start reporting and resolving facility issues. Unlimited labels, zero cost.",
    cta: { label: "Start free", href: "/auth?mode=signup" },
    features: [
      { label: "Unlimited QR labels", highlight: true },
      { label: "2 Avery sheet types" },
      { label: "Owner + 2 team members" },
      { label: "Email notifications" },
      { label: "Issue dashboard" },
      { label: "AI category suggestions" },
      {
        label: "\"Powered by ScanSolve\" badge",
        note: "shown on your reporter pages",
      },
    ],
    notIncluded: [
      "Your own logo on reporter pages",
      "Instant push alerts",
      "All 4 Avery sheet types",
    ],
  },
  {
    name: "Prime",
    badge: "Popular",
    tagline: "£15/mo · One flat price",
    priceLabel: "£15/mo",
    priceSub: "One flat price for your whole team.",
    description:
      "Your brand, front and centre. Built for teams who want to look professional and react fast when something breaks.",
    cta: { label: "Get Prime", href: "/auth?mode=signup" },
    isPrimary: true,
    features: [
      { label: "Everything in Starter" },
      { label: "Your own logo on reporter pages", highlight: true },
      { label: "Owner + up to 20 team members" },
      { label: "All 4 Avery sheet types" },
      {
        label: "Email + instant push alerts",
        highlight: true,
        note: "add ScanSolve to your home screen and get a push the moment an issue is raised",
      },
    ],
    notIncluded: [],
  },
  {
    name: "Enterprise",
    badge: null,
    tagline: "Price on application",
    priceLabel: "Contact us",
    priceSub: "Custom contract · Dedicated support",
    description:
      "For estates and multi-site operations that want us to set it up with them, plus the paperwork a procurement team asks for.",
    cta: { label: "Talk to us", href: "mailto:hello@scansolve.co", external: true },
    features: [
      { label: "Everything in Prime" },
      { label: "Unlimited team members", highlight: true },
      { label: "We install your first codes on site", highlight: true, note: "we plan the zones and put the labels up with you" },
      { label: "Named contact with agreed response times" },
      { label: "Data processing agreement" },
      { label: "Quarterly review of your estate data" },
      { label: "Onboarding for your team" },
    ],
    notIncluded: [],
  },
];

// ── Comparison table rows ───────────────────────────────────────────────────

const comparisonRows = [
  {
    section: "Core",
    rows: [
      { feature: "QR labels / locations", starter: "Unlimited", prime: "Unlimited", enterprise: "Unlimited" },
      { feature: "Avery sheet types", starter: "2 of 4", prime: "All 4", enterprise: "All 4" },
      { feature: "Team members", starter: "3 (owner + 2)", prime: "21 (owner + 20)", enterprise: "Unlimited" },
    ],
  },
  {
    section: "Branding",
    rows: [
      { feature: "\"Powered by ScanSolve\" badge", starter: true, prime: false, enterprise: false },
      { feature: "Your own logo", starter: false, prime: true, enterprise: true },
    ],
  },
  {
    section: "Notifications",
    rows: [
      { feature: "Email alerts", starter: true, prime: true, enterprise: true },
      { feature: "Instant push alerts", starter: false, prime: true, enterprise: true },
    ],
  },
  {
    section: "Data & Reporting",
    rows: [
      { feature: "Issue dashboard", starter: true, prime: true, enterprise: true },
      { feature: "Insights — resolution times + CSV export", starter: false, prime: true, enterprise: true },
    ],
  },
  {
    section: "Service",
    rows: [
      { feature: "On-site setup with you", starter: false, prime: false, enterprise: true },
      { feature: "Named contact + response times", starter: false, prime: false, enterprise: true },
      { feature: "Data processing agreement", starter: false, prime: false, enterprise: true },
    ],
  },
];

// ── Components ──────────────────────────────────────────────────────────────

function CompareCell({ value }: { value: boolean | string | undefined }) {
  if (typeof value === "string") {
    return <span className="text-sm font-medium text-slate-700">{value}</span>;
  }
  if (value === true) {
    return <Check className="h-4 w-4 text-emerald-500 mx-auto" />;
  }
  return <X className="h-4 w-4 text-slate-200 mx-auto" />;
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
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
            <Link href="/pricing" className="text-sm font-semibold text-indigo-600">Pricing</Link>
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
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-600 mb-5">
          <Sparkles className="h-3 w-3" />
          Simple, transparent pricing
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-tight mb-4">
          Start free.{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Upgrade when you need to.
          </span>
        </h1>
        <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">
          Unlimited QR labels on every plan — labels on walls are your competitive advantage and we&apos;ll never take that away.
        </p>
      </section>

      {/* ── Pricing cards ───────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-5 items-start">

          {/* Starter */}
          <div className="rounded-3xl bg-white border border-slate-200 p-7 flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                  <Zap className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="font-bold text-slate-900 text-lg">Starter</span>
              </div>
              <div className="mb-1">
                <span className="text-4xl font-bold text-slate-900">Free</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">No card required · No time limit</p>
              <p className="text-sm text-slate-500 leading-relaxed">
                Everything you need to start reporting and resolving facility issues. Unlimited labels, zero cost.
              </p>
            </div>

            <Link
              href="/auth?mode=signup"
              className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-2xl border-2 border-slate-200 font-semibold text-sm text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-all"
            >
              Start free
            </Link>

            <div className="space-y-3">
              {tiers[0].features.map((f) => (
                <div key={f.label} className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <span className={`text-sm ${f.highlight ? "font-semibold text-slate-900" : "text-slate-600"}`}>
                      {f.label}
                    </span>
                    {f.note && (
                      <p className="text-xs text-slate-400">{f.note}</p>
                    )}
                  </div>
                </div>
              ))}
              {tiers[0].notIncluded.map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <X className="h-4 w-4 text-slate-300 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-400">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prime — featured */}
          <div className="rounded-3xl bg-gradient-to-b from-indigo-600 to-violet-700 p-7 flex flex-col gap-6 shadow-2xl shadow-indigo-500/30 ring-1 ring-indigo-400/20 md:-mt-4 md:mb-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-white text-lg">Prime</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white text-indigo-600 text-xs font-bold tracking-wide">
                  Popular
                </span>
              </div>
              <div className="flex items-baseline gap-2.5 mb-1">
                <span className="text-4xl font-bold text-white">£15<span className="text-xl font-semibold">/mo</span></span>
              </div>
              <p className="text-xs text-indigo-200 mb-4">Limited time discount.</p>
              <p className="text-sm text-indigo-100 leading-relaxed">
                Your brand, front and centre. Built for teams who want to look professional and react fast when something breaks.
              </p>
            </div>

            <PrimeCtaButton
              label="Get Prime"
              className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-2xl bg-white font-semibold text-sm text-indigo-600 hover:bg-indigo-50 transition-all shadow-lg shadow-indigo-900/20"
            />

            <div className="space-y-3">
              {tiers[1].features.map((f) => (
                <div key={f.label} className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-indigo-200 mt-0.5 shrink-0" />
                  <div>
                    <span className={`text-sm ${f.highlight ? "font-semibold text-white" : "text-indigo-100"}`}>
                      {f.label}
                    </span>
                    {f.note && (
                      <p className="text-xs text-indigo-300">{f.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enterprise */}
          <div className="rounded-3xl bg-slate-900 border border-slate-700 p-7 flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800">
                  <Building2 className="h-4 w-4 text-slate-300" />
                </div>
                <span className="font-bold text-white text-lg">Enterprise</span>
              </div>
              <div className="mb-1">
                <span className="text-2xl font-bold text-white">Contact us</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Custom contract · Dedicated support</p>
              <p className="text-sm text-slate-400 leading-relaxed">
                For multi-site operations, chains, and organisations that need full control, deep integrations, and an SLA.
              </p>
            </div>

            <a
              href="mailto:hello@scansolve.co"
              className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-2xl border-2 border-slate-700 font-semibold text-sm text-slate-300 hover:border-slate-500 hover:text-white transition-all"
            >
              Talk to us
            </a>

            <div className="space-y-3">
              {tiers[2].features.map((f) => (
                <div key={f.label} className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-400">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── The moat callout ────────────────────────────────────────── */}
      <section className="bg-white border-y border-slate-100 py-10">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-2xl font-bold text-slate-900 mb-3">
            Unlimited QR labels on every plan. Always.
          </p>
          <p className="text-slate-500 leading-relaxed max-w-xl mx-auto text-sm">
            Most software limits the core unit to force upgrades. We don&apos;t. Every label on a wall is another reporter, another data point, another issue caught before it becomes expensive. Saturating your site is the goal — we won&apos;t cap it.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm">
            <span className="text-slate-400">Comparing us to a CMMS?</span>
            <Link href="/compare/maintainx" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">ScanSolve vs MaintainX</Link>
            <span className="text-slate-300">·</span>
            <Link href="/compare/upkeep" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">vs UpKeep</Link>
          </div>
        </div>
      </section>

      {/* ── Why upgrade callout (two levers) ────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest text-center mb-3">
          Why go Prime?
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-10">
          Two types of upgrade, same result.
        </h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="rounded-3xl bg-white border border-slate-100 p-8 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 mb-5">
              <Zap className="h-5 w-5 text-indigo-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Single site · Your image matters</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              On Starter, your reporter page says &ldquo;Powered by ScanSolve&rdquo; and shows ads. That&apos;s fine to start — but if your staff or visitors are seeing it every time they report an issue, your brand deserves better. Prime removes every trace of us and puts your logo front and centre.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Your logo", "Your brand", "No ScanSolve badge"].map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-8 shadow-lg shadow-indigo-500/20">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 mb-5">
              <Users className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Multi-site · You&apos;ve outgrown free</h3>
            <p className="text-sm text-indigo-100 leading-relaxed">
              Running a gym chain, a shopping centre, or a hospital estate? Three seats and email-only alerts won&apos;t cut it. Prime gives your team room to grow, and instant push alerts the moment a problem is reported — so nothing sits unnoticed.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["20 team members", "Push alerts", "All sheet types"].map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Full comparison table ────────────────────────────────────── */}
      <section className="bg-white border-y border-slate-100 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest text-center mb-3">
            Full comparison
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-10">
            Everything side by side
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-5 py-4 font-semibold text-slate-500 w-1/2">Feature</th>
                  <th className="text-center px-4 py-4 font-semibold text-slate-700 w-1/6">Starter</th>
                  <th className="text-center px-4 py-4 font-bold text-indigo-600 w-1/6 bg-indigo-50">Prime</th>
                  <th className="text-center px-4 py-4 font-semibold text-slate-700 w-1/6">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((group) => (
                  <>
                    <tr key={group.section} className="bg-slate-50/60">
                      <td colSpan={4} className="px-5 py-2.5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          {group.section}
                        </span>
                      </td>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.feature} className="border-t border-slate-100 hover:bg-slate-50/40 transition-colors">
                        <td className="px-5 py-3.5 text-slate-600">{row.feature}</td>
                        <td className="px-4 py-3.5 text-center">
                          <CompareCell value={row.starter} />
                        </td>
                        <td className="px-4 py-3.5 text-center bg-indigo-50/50">
                          <CompareCell value={row.prime} />
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <CompareCell value={row.enterprise} />
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Feature icons strip ──────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest text-center mb-3">
          What you get
        </p>
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-10">
          Built for the whole team
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {[
            {
              icon: QrCode,
              color: "bg-indigo-50 text-indigo-500",
              title: "Unlimited QR labels",
              body: "Print as many as you need, wherever issues might arise. No label caps on any plan.",
            },
            {
              icon: Bell,
              color: "bg-amber-50 text-amber-500",
              title: "Instant alerts",
              body: "Email on every plan. Add instant push alerts on Prime — install ScanSolve to your home screen and get a push the second a problem is reported.",
            },
            {
              icon: Users,
              color: "bg-violet-50 text-violet-500",
              title: "Team management",
              body: "Invite your team, assign issues, and track who's doing what — from one dashboard.",
            },
            {
              icon: Layers,
              color: "bg-emerald-50 text-emerald-500",
              title: "Avery label sheets",
              body: "Choose from standard Avery sheet layouts. Starter gets two; Prime gets all four.",
            },
            {
              icon: MessageSquare,
              color: "bg-rose-50 text-rose-500",
              title: "No app for reporters",
              body: "Anyone can report an issue — no download, no account, no friction. Just scan and submit.",
            },
            {
              icon: BarChart3,
              color: "bg-sky-50 text-sky-500",
              title: "Issue tracking",
              body: "From reported to resolved, every issue is tracked with status, assignment, and history.",
            },
          ].map(({ icon: Icon, color, title, body }) => (
            <div key={title} className="rounded-2xl bg-white border border-slate-100 p-6 shadow-sm">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color} mb-4`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-slate-100 py-16">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest text-center mb-3">
            Questions
          </p>
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-10">
            Pricing FAQ
          </h2>
          <div className="divide-y divide-slate-100">
            {[
              {
                q: "Is the Starter tier really free forever?",
                a: "Yes. Starter is free with no time limit and no credit card. You get unlimited QR labels, a full issue dashboard, and email notifications — for as long as you need them. The only constraints are team size (3 members) and a small \"Powered by ScanSolve\" badge on your reporter pages.",
              },
              {
                q: "What does the free tier look like to my staff?",
                a: "Exactly like the paid one, with one difference: the reporter page carries a small \"Powered by ScanSolve\" badge. There are no ads anywhere on ScanSolve, on any plan. Prime replaces that badge with your own logo.",
              },
              {
                q: "How much does Prime cost?",
                a: "Prime is £15/month for your whole organisation, on a monthly contract with no annual commitment. That is one flat price, not a per-user fee — adding team members up to 20 costs nothing extra. We will give existing subscribers notice before any price change.",
              },
              {
                q: "Can I use ScanSolve for multiple sites on Starter?",
                a: "Yes — there is no location or QR label limit on any plan. You can run multiple sites on Starter. The limits are around team size (3 members) and notification channels (email only). If you need a larger team or instant push alerts across those sites, Prime is the right move.",
              },
              {
                q: "What counts as a 'team member'?",
                a: "A team member is anyone you invite to your ScanSolve account who can log in to view and manage issues in the dashboard. Reporters who scan QR codes are not counted — they don't have accounts.",
              },
              {
                q: "What's included in Enterprise?",
                a: "Enterprise is for larger estates and multi-site operations. It adds unlimited team members, on-site setup where we plan the zones and put the first codes up with you, a named contact with agreed response times, a data processing agreement, and a quarterly review of your data. SSO, audit logging and platform integrations are not built yet — we would rather tell you that now than at procurement. Get in touch and we will scope it with you.",
              },
            ].map(({ q, a }) => (
              <details key={q} className="group">
                <summary className="flex items-center justify-between gap-4 cursor-pointer py-5 list-none select-none">
                  <span className="text-base font-semibold text-slate-900 group-open:text-indigo-600 transition-colors">
                    {q}
                  </span>
                  <Shield className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-open:text-indigo-400 group-open:rotate-12" />
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
          Ready to get issues fixed?
        </h2>
        <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
          Start free with unlimited QR labels. No card, no deadline, no pressure.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/auth?mode=signup"
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Start Free — No Card Needed
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="mailto:hello@scansolve.co"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold hover:border-indigo-300 hover:text-indigo-600 transition-all"
          >
            Talk to us about Enterprise
          </a>
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Unlimited QR labels · Free forever on Starter · No card required
        </p>
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
            <Link href="/pricing" className="hover:text-slate-600 transition-colors font-semibold text-slate-500">Pricing</Link>
            <Link href="/trust" className="hover:text-slate-600 transition-colors">Trust</Link>
            <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy</Link>
            <Link href="/auth" className="hover:text-slate-600 transition-colors">Manager Sign In →</Link>
          </div>
        </div>
      </footer>

    </main>
  );
}
