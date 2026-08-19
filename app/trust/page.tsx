import type { Metadata } from "next";
import Link from "next/link";
import { QrCode, ArrowRight, ShieldCheck, AlertTriangle } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://scansolve.co";

export const metadata: Metadata = {
  title: "Trust and security",
  description:
    "How ScanSolve stores and protects your data: EU hosting, row-level isolation between organisations, encryption, subprocessors, and an honest list of what we have not built yet.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "ScanSolve — trust and security",
    description:
      "Where your data lives, how organisations are separated, who processes it, and what we have not built yet.",
    url: `${APP_URL}/trust`,
    siteName: "ScanSolve",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ScanSolve" }],
  },
  alternates: { canonical: `${APP_URL}/trust` },
};

// Kept deliberately close to the code. If a control changes, change it here too —
// a stale trust page is worse than no trust page.
const SUBPROCESSORS = [
  { name: "Supabase", role: "Database, authentication and file storage", where: "EU (eu-west-1, Ireland)" },
  { name: "Vercel", role: "Application hosting and cookieless analytics", where: "Global edge network" },
  { name: "Resend", role: "Transactional email (magic links, notifications)", where: "EU / US" },
  { name: "Stripe", role: "Subscription payments", where: "EU / US" },
  { name: "Google", role: "Gemini, for support chat and category suggestions", where: "EU / US" },
  { name: "Upstash", role: "Rate limiting, where enabled", where: "EU" },
];

const NOT_YET = [
  {
    item: "Automated backups",
    detail:
      "Not yet enabled. This is the next infrastructure change and will be in place before we onboard a paying customer.",
  },
  {
    item: "SOC 2 and ISO 27001",
    detail:
      "Neither certification is held. We will start the process when a customer's procurement requires it, and we will say so rather than imply otherwise.",
  },
  {
    item: "Independent penetration test",
    detail:
      "Not yet commissioned. The application has had an internal security audit; findings from it were fixed and are tracked in the repository.",
  },
  {
    item: "Single sign-on (SSO / SAML)",
    detail: "Not built. Sign-in is by magic link or a one-time code.",
  },
  {
    item: "Audit logging",
    detail:
      "Not built. Issue history is recorded, but administrative actions are not written to a separate audit trail.",
  },
  {
    item: "Dedicated database instances",
    detail:
      "All organisations share one database, separated as described above. A dedicated instance is available as a paid Enterprise option with a lead time we will agree in writing.",
  },
];

export default function TrustPage() {
  return (
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

      <article className="max-w-3xl mx-auto px-6 py-16">
        <header className="mb-10">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-3">Trust</p>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Trust and security</h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            This page is for the person who has to sign off on ScanSolve. It describes where your data
            lives, how one organisation is kept apart from another, and who else processes it. It also
            lists what we have not built, because you will find that out eventually and it is better
            that you find it out here.
          </p>
        </header>

        <div className="space-y-10 text-slate-600 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Where your data lives</h2>
            <p>
              All application data is stored in a Supabase Postgres database hosted in the European
              Union, in the <strong>eu-west-1 region (Ireland)</strong>. Photo uploads are stored in
              Supabase Storage in the same region. Data is not replicated outside the EU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">How organisations are separated</h2>
            <p className="mb-3">
              Every organisation&apos;s data carries an organisation identifier, and separation is
              enforced in two places:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong>Row-level security in the database.</strong> Postgres row-level security is
                enabled on every table that holds customer data, including issues, locations, members,
                invitations and label records. A signed-in user&apos;s queries can only return rows
                belonging to an organisation they are a member of.
              </li>
              <li>
                <strong>Organisation scoping in the API.</strong> People who report a fault do not have
                accounts, so those writes are made by the server rather than the browser. Those server
                paths run with elevated database rights and are scoped to the correct organisation in
                application code.
              </li>
            </ul>
            <p className="mt-3">
              We describe both because only the first is enforced by the database. Saying
              &ldquo;database-enforced isolation&rdquo; on its own would overstate it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Encryption</h2>
            <p>
              All traffic to ScanSolve is served over HTTPS, with HTTP Strict Transport Security set.
              Data is encrypted at rest by our database and storage provider. Photo uploads are never
              in a public bucket: each is served through a signed link that expires after seven days,
              and the dashboard requests a fresh link when one is close to expiry.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Signing in</h2>
            <p>
              Managers sign in with a magic link or a one-time code sent to their email address. There
              are no passwords, so there is no password database to steal. People reporting a fault
              never sign in at all: they scan a code, submit a form, and can leave an email address if
              they want an update.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">What we collect from reporters</h2>
            <p>
              A fault report contains the category, an optional description, an optional photo, and an
              optional contact email. We also record a timestamp and basic request details for abuse
              prevention. We do not track reporters across sites, and we do not use analytics cookies
              anywhere on the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Application security</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>A content security policy and the standard security headers are set on every response, including frame protection, MIME-type protection, referrer and permissions policies.</li>
              <li>Public endpoints are rate limited to slow abuse and automated submissions.</li>
              <li>Card details are handled by Stripe. They never reach our servers and we cannot see them.</li>
              <li>The codebase has had a security audit; the findings were fixed and the work is recorded in our repository history.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Who else processes your data</h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-100 mt-4">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-5 py-3 font-semibold text-slate-500">Processor</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500">Purpose</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500">Region</th>
                  </tr>
                </thead>
                <tbody>
                  {SUBPROCESSORS.map((s) => (
                    <tr key={s.name} className="border-t border-slate-100">
                      <td className="px-5 py-3 font-medium text-slate-900">{s.name}</td>
                      <td className="px-4 py-3 text-slate-600">{s.role}</td>
                      <td className="px-4 py-3 text-slate-500">{s.where}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3">
              We do not sell your data and we do not use it to train AI models. A data processing
              agreement is available to organisation account holders on request.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Getting your data out, or deleted</h2>
            <p>
              Issue data can be exported as CSV from the Insights page. If you want your organisation
              and everything in it deleted, email us and we will do it and confirm when it is done.
              There is no retention period we hold you to.
            </p>
          </section>

          {/* The honest block. This is the point of the page. */}
          <section>
            <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-7">
              <div className="flex items-center gap-2.5 mb-4">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <h2 className="text-xl font-bold text-slate-900">What we have not built yet</h2>
              </div>
              <p className="mb-5 text-slate-600">
                ScanSolve is a young product. These are the things a procurement or security review
                usually asks for that we cannot currently offer. We would rather you knew now.
              </p>
              <dl className="space-y-4">
                {NOT_YET.map((n) => (
                  <div key={n.item}>
                    <dt className="font-semibold text-slate-900">{n.item}</dt>
                    <dd className="text-sm text-slate-600 leading-relaxed">{n.detail}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Reporting a security problem</h2>
            <p>
              If you find a vulnerability, email <strong>support@scansolve.co</strong> with enough
              detail to reproduce it. We will acknowledge it within two working days and tell you what
              we are doing about it. We will not take legal action against anyone who reports a problem
              in good faith and gives us a chance to fix it before disclosing it.
            </p>
          </section>

          <section className="rounded-2xl bg-white border border-slate-100 p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-600 leading-relaxed">
                Questions from a security or procurement team are welcome at{" "}
                <strong>support@scansolve.co</strong>. If you send a questionnaire, we will complete it
                and mark anything we do not have as not held, rather than leaving it blank.
              </p>
            </div>
          </section>

          <p className="text-sm text-slate-400 pt-2">
            Last reviewed: August 2026. See also our{" "}
            <Link href="/privacy" className="text-indigo-600 hover:text-indigo-700 font-medium">privacy policy</Link>.
          </p>
        </div>
      </article>

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
            <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy</Link>
            <Link href="/auth" className="hover:text-slate-600 transition-colors">Manager Sign In →</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
