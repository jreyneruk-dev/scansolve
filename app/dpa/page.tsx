import type { Metadata } from "next";
import Link from "next/link";
import { QrCode, ArrowRight } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://scansolve.co";

export const metadata: Metadata = {
  title: "Data processing agreement",
  description:
    "ScanSolve's standard data processing agreement under UK GDPR: roles, subprocessors, security measures, breach notification, and deletion.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${APP_URL}/dpa` },
};

const SUBPROCESSORS = [
  { name: "Supabase", purpose: "Database, authentication, file storage", location: "Ireland (eu-west-1)" },
  { name: "Vercel", purpose: "Application hosting, cookieless analytics", location: "EU / US" },
  { name: "Resend", purpose: "Transactional email", location: "EU / US" },
  { name: "Stripe", purpose: "Payment processing", location: "EU / US" },
  { name: "Google", purpose: "Gemini, support chat and category suggestions", location: "EU / US" },
  { name: "Upstash", purpose: "Rate limiting, where enabled", location: "EU" },
];

export default function DpaPage() {
  return (
    <main className="min-h-dvh bg-slate-50 text-slate-900">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <QrCode className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">ScanSolve</span>
          </Link>
          <Link href="/auth" className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            Sign in <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-16">
        <header className="mb-10">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Data processing agreement</h1>
          <p className="text-sm text-slate-400">Version 1.0 · Last updated 18 August 2026</p>
        </header>

        <div className="space-y-8 text-slate-600 leading-relaxed">
          <section>
            <p>
              This agreement applies where ScanSolve processes personal data on your behalf. It forms
              part of our{" "}
              <Link href="/terms" className="text-indigo-600 hover:text-indigo-700 font-medium">terms of service</Link>{" "}
              and takes effect when you start using the service. We will also sign a countersigned copy
              on request &mdash; email support@scansolve.co.
            </p>
            <p className="mt-3">
              &ldquo;UK GDPR&rdquo; means the retained EU General Data Protection Regulation as it
              applies in the UK, together with the Data Protection Act 2018.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Roles</h2>
            <p>
              You are the controller of personal data submitted through your QR labels and held in your
              organisation&apos;s account. We are the processor, and we act only on your documented
              instructions, which include your use of the service and this agreement. If we believe an
              instruction breaches data protection law, we will tell you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. What we process</h2>
            <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden mt-3">
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-900 align-top w-1/3">Subject matter</td>
                  <td className="px-4 py-3">Providing QR code facility fault reporting.</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-900 align-top">Duration</td>
                  <td className="px-4 py-3">For as long as your account is active, plus the deletion period in section 8.</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-900 align-top">Nature and purpose</td>
                  <td className="px-4 py-3">Collecting fault reports, routing them to your team, and tracking them to resolution.</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-900 align-top">Categories of data</td>
                  <td className="px-4 py-3">
                    Account holders: name and email address. Reporters: an optional contact email, the
                    content of the report, an optional photo, and technical data such as timestamp and
                    browser type held for abuse prevention.
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-900 align-top">Data subjects</td>
                  <td className="px-4 py-3">Your staff and team members, and any person who scans a label and chooses to submit a report.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900 align-top">Special category data</td>
                  <td className="px-4 py-3">None. The service is not designed for it and our terms prohibit it.</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Our obligations</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Process personal data only on your instructions, except where the law requires otherwise.</li>
              <li>Keep the security measures described in section 6, and review them as the service changes.</li>
              <li>Make sure anyone with access is bound by confidentiality.</li>
              <li>Help you respond to data subject requests and, where relevant, to impact assessments and consultations with the regulator.</li>
              <li>Tell you about a personal data breach without undue delay, as set out in section 7.</li>
              <li>Delete or return personal data at the end of the agreement, as set out in section 8.</li>
              <li>Give you the information you reasonably need to show we are meeting these obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Your obligations</h2>
            <p>
              You confirm you have a lawful basis for the data you collect through the service, and
              that where a label is placed in a public or semi-public area, people are given the
              information they are entitled to. You are responsible for the categories you configure
              and for what your team enters into the system.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Subprocessors</h2>
            <p className="mb-3">
              You give general authorisation for us to use the subprocessors below. Each is bound by
              terms no less protective than this agreement. We will give at least 30 days&apos; notice
              by email before adding or replacing one, and you may object on reasonable data protection
              grounds; if we cannot resolve the objection you may terminate without penalty.
            </p>
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-5 py-3 font-semibold text-slate-500">Subprocessor</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500">Purpose</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {SUBPROCESSORS.map((s) => (
                    <tr key={s.name} className="border-t border-slate-100">
                      <td className="px-5 py-3 font-medium text-slate-900">{s.name}</td>
                      <td className="px-4 py-3">{s.purpose}</td>
                      <td className="px-4 py-3 text-slate-500">{s.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Security measures</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Primary data is stored in the European Union, in Ireland (eu-west-1).</li>
              <li>Encryption in transit using HTTPS with HTTP Strict Transport Security, and encryption at rest by our storage providers.</li>
              <li>Row-level security enabled on every table holding customer data, so a signed-in user can only reach their own organisation&apos;s rows. Server-side paths that accept reports from people without accounts are scoped to the correct organisation in application code.</li>
              <li>Sign-in by emailed link or one-time code. No passwords are stored.</li>
              <li>Photo uploads held in private storage and served through links that expire after seven days.</li>
              <li>Rate limiting on public endpoints, and a content security policy with standard security headers.</li>
              <li>Card details are handled by Stripe and never reach our systems.</li>
            </ul>
            <p className="mt-3">
              Our{" "}
              <Link href="/trust" className="text-indigo-600 hover:text-indigo-700 font-medium">trust and security page</Link>{" "}
              is kept current and lists the controls we do not yet have, including automated backups
              and independent certification.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Personal data breaches</h2>
            <p>
              If we become aware of a personal data breach affecting your data, we will notify you
              without undue delay and in any event within 48 hours. We will describe what happened, the
              categories and approximate number of records involved, the likely consequences, and what
              we are doing about it. We will help you meet your own notification duties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">8. Deletion and return</h2>
            <p>
              You can export issue data as CSV at any time. On termination, or on your written request,
              we will delete your organisation&apos;s personal data within 30 days and confirm when it
              is done, unless we are required by law to keep it. Where deletion from backup media is
              not immediately possible, the data remains protected by this agreement until the backup
              cycle overwrites it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">9. Audits</h2>
            <p>
              On reasonable written notice, and no more than once a year unless a regulator requires
              otherwise, we will provide the information you need to verify our compliance and respond
              to a reasonable security questionnaire. Where we hold third party audit reports for our
              subprocessors, we will make those available instead of an on-site audit where they answer
              the question.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">10. International transfers</h2>
            <p>
              Primary storage is in the UK and EU. Where a subprocessor processes data outside the UK
              or EEA, that transfer is made under the UK International Data Transfer Addendum or
              Standard Contractual Clauses, together with any additional measures required.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">11. Priority and law</h2>
            <p>
              Where this agreement conflicts with our terms of service, this agreement takes precedence
              on data protection matters. It is governed by the law of England and Wales.
            </p>
          </section>

          <p className="text-sm text-slate-400 pt-2">
            Questions from a data protection officer are welcome at support@scansolve.co. We will
            complete a security questionnaire and mark anything we do not hold as not held.
          </p>
        </div>
      </article>

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
            <Link href="/terms" className="hover:text-slate-600 transition-colors">Terms</Link>
            <Link href="/trust" className="hover:text-slate-600 transition-colors">Trust</Link>
            <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
