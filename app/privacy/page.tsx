import type { Metadata } from "next";
import Link from "next/link";
import { QrCode } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "ScanSolve privacy policy — how we collect, use, and protect your data.",
  robots: { index: true, follow: true },
  openGraph: {
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://scansolve.co"}/privacy`,
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://scansolve.co"}/privacy`,
  },
};

export default function PrivacyPage() {
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
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-16">
        <header className="mb-10">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Privacy Policy</h1>
          <p className="text-sm text-slate-400">Last updated: May 2025</p>
        </header>

        <div className="space-y-8 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Who we are</h2>
            <p>
              ScanSolve is a web-based facility issue reporting platform operated at scansolve.co. If you have any questions about this privacy policy, please contact us via the sign-in page at scansolve.co/auth.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">What data we collect</h2>
            <p className="mb-3"><strong>Facility managers (account holders):</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2 mb-4">
              <li>Email address — used for authentication and notifications</li>
              <li>Organisation name and location names — used to configure your account</li>
            </ul>
            <p className="mb-3"><strong>Issue reporters (no account required):</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Issue category, description, and optional photo — the content of your report</li>
              <li>Contact email — only if you choose to provide it for status updates</li>
              <li>Basic request metadata (timestamp, browser type) — used for fraud prevention</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">How we use your data</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>To deliver the ScanSolve service (routing issue reports to the right facility manager)</li>
              <li>To send authentication emails (magic links) to facility managers</li>
              <li>To send issue notification and status emails</li>
              <li>To improve the service and fix technical issues</li>
            </ul>
            <p className="mt-3">We do not sell your data. We do not share your data with third parties except as required to deliver the service (Supabase for data storage, Resend for email delivery).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Data storage and security</h2>
            <p>
              Your data is stored on Supabase (EU region). Issue photo uploads are stored in Supabase Storage and accessed via signed URLs that expire after 7 days. We use row-level security to ensure each organisation can only access its own data. All connections are encrypted via HTTPS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Cookies</h2>
            <p>
              ScanSolve uses session cookies for authentication (facility manager accounts only). These are strictly necessary cookies — no advertising or tracking cookies are used. We do not use Google Analytics or any third-party tracking scripts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Your rights (UK GDPR)</h2>
            <p className="mb-3">If you are based in the UK or EU, you have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing of your data</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, contact us via scansolve.co/auth.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Data retention</h2>
            <p>
              Account data is retained for as long as your account is active. Issue reports are retained for as long as the associated organisation account is active. You may request deletion of your account and associated data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Changes to this policy</h2>
            <p>
              We may update this privacy policy as the service evolves. Significant changes will be communicated to account holders by email.
            </p>
          </section>
        </div>
      </article>

      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600">
              <QrCode className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-slate-600">ScanSolve</span>
          </div>
          <p>© {new Date().getFullYear()} ScanSolve. All rights reserved.</p>
          <Link href="/" className="hover:text-slate-600 transition-colors">← Back to home</Link>
        </div>
      </footer>
    </main>
  );
}
