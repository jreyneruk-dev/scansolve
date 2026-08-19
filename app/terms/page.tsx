import type { Metadata } from "next";
import Link from "next/link";
import { QrCode, ArrowRight } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://scansolve.co";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The terms on which ScanSolve is provided: plans and fees, acceptable use, data ownership, availability, liability, and termination.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${APP_URL}/terms` },
};

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Terms of service</h1>
          <p className="text-sm text-slate-400">Version 1.0 · Last updated 18 August 2026</p>
        </header>

        <div className="space-y-8 text-slate-600 leading-relaxed">
          <section>
            <p>
              These terms govern your use of ScanSolve. By creating an account, or by using the
              service, you agree to them. If you are agreeing on behalf of an organisation, you
              confirm you have authority to bind it. ScanSolve is provided for business use. It is
              not intended for consumers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Who we are</h2>
            <p>
              ScanSolve (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates the service at scansolve.co.
              You can reach us at support@scansolve.co. In these terms, &ldquo;you&rdquo; means the
              organisation holding the account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. What the service does</h2>
            <p>
              ScanSolve lets you create and print QR code labels, place them at locations you choose,
              and receive fault reports submitted by people who scan them. You manage those reports in
              a dashboard, assign them, and track them to resolution. We may change or improve the
              service over time. If we remove a material feature you rely on, we will tell account
              holders by email before it happens.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Your account</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>You are responsible for activity under your account and for the people you invite to it.</li>
              <li>Sign-in is by emailed link or one-time code. Keep access to that mailbox secure.</li>
              <li>You must give accurate account information and keep it current.</li>
              <li>You must be at least 18 and able to enter a contract.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Acceptable use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Use the service unlawfully, or to store or transmit unlawful content.</li>
              <li>Place QR labels in a way intended to deceive people about who is collecting their report.</li>
              <li>Attempt to access another organisation&apos;s data, probe our systems, or bypass rate limits.</li>
              <li>Resell or provide the service to a third party as your own, unless we agree in writing.</li>
              <li>Use the service to collect special category personal data, such as health or biometric data.</li>
            </ul>
            <p className="mt-3">
              We may suspend an account that we reasonably believe is breaching this section, or that
              poses a security or legal risk. Where practical we will tell you first and give you a
              chance to put it right.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Plans, fees and renewal</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Starter</strong> is free. We may change what it includes, or withdraw it, on 30 days&apos; notice by email.</li>
              <li><strong>Prime</strong> is a monthly subscription, charged in advance, renewing automatically until cancelled. Prices are shown on our pricing page and exclude VAT where applicable.</li>
              <li><strong>Enterprise</strong> is provided under a separate order form, which takes precedence over these terms where the two conflict.</li>
              <li>You can cancel a subscription at any time. It runs until the end of the paid period, and we do not give partial refunds for a period already started.</li>
              <li>We may change prices. Existing subscribers get at least 30 days&apos; notice by email, and the change applies from the next renewal.</li>
              <li>Payments are processed by Stripe. We do not receive or store your card details.</li>
              <li>If a payment fails, we may suspend paid features after telling you. Your data is not deleted for non-payment during a suspension.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Your data</h2>
            <p className="mb-3">
              Your data stays yours. We do not sell it and we do not use it to train AI models. We use
              it to run the service, and to keep the service secure and working.
            </p>
            <p className="mb-3">
              For personal data contained in fault reports, you are the controller and we are the
              processor. Our{" "}
              <Link href="/dpa" className="text-indigo-600 hover:text-indigo-700 font-medium">data processing agreement</Link>{" "}
              sets out that relationship and forms part of these terms.
            </p>
            <p>
              You can export issue data as CSV at any time. If you ask us to delete your organisation
              and its data, we will do so within 30 days and confirm when it is done. We may keep
              backups and records we are required to keep, for no longer than necessary.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Availability and support</h2>
            <p>
              We work to keep the service available, but we do not promise it will be uninterrupted or
              error free. Starter and Prime are provided without a service level agreement. Support is
              by email to support@scansolve.co, and we aim to reply within two working days. Enterprise
              customers get the response times stated in their order form. We may take the service down
              for maintenance, and we will give notice where we reasonably can.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">8. Our intellectual property</h2>
            <p>
              We own the service, the software and our branding. We grant you a non-exclusive,
              non-transferable right to use it while your account is active. You may use the QR labels
              you generate in your own premises without restriction. On the Starter plan, reporter
              pages carry a &ldquo;Powered by ScanSolve&rdquo; badge; paid plans can replace it with
              your own logo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">9. Liability</h2>
            <p className="mb-3">
              Nothing in these terms limits liability for death or personal injury caused by
              negligence, for fraud or fraudulent misrepresentation, or for anything else that cannot
              lawfully be limited.
            </p>
            <p className="mb-3">Subject to that:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Neither of us is liable for indirect or consequential loss, loss of profit, loss of business, or loss of anticipated savings.</li>
              <li>Our total liability in any 12 month period is limited to the fees you paid us in the 12 months before the claim arose.</li>
              <li>If you are on the Starter plan and have paid us nothing, our total liability is limited to £100.</li>
              <li>ScanSolve is a reporting tool. It is not a safety system, an alarm, or a substitute for inspection, maintenance or statutory compliance. You remain responsible for the condition of your premises and for acting on what is reported.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">10. Indemnity</h2>
            <p>
              You will indemnify us against claims arising from your unlawful use of the service, or
              from content you or your reporters submit through it, except to the extent the claim is
              caused by our breach of these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">11. Term and ending the agreement</h2>
            <p>
              These terms apply while your account exists. You can close your account at any time.
              Either of us may end the agreement on 30 days&apos; written notice, and we may end it
              immediately for a material breach that is not put right within 14 days of us asking. On
              termination your right to use the service stops, and you should export any data you want
              to keep.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">12. Changes to these terms</h2>
            <p>
              We may update these terms. For material changes we will give account holders at least 30
              days&apos; notice by email, and the version and date at the top of this page will change.
              Continuing to use the service after that means you accept the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">13. General</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Neither of us may transfer this agreement without the other&apos;s consent, except as part of a sale of the business.</li>
              <li>If a clause is unenforceable, the rest still applies.</li>
              <li>Not acting on a breach straight away does not waive the right to act later.</li>
              <li>These terms, the data processing agreement, and any order form are the whole agreement between us.</li>
              <li>Nobody other than you and us has rights under this agreement.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">14. Governing law</h2>
            <p>
              These terms are governed by the law of England and Wales, and the courts of England and
              Wales have exclusive jurisdiction.
            </p>
          </section>

          <p className="text-sm text-slate-400 pt-2">
            See also our{" "}
            <Link href="/privacy" className="text-indigo-600 hover:text-indigo-700 font-medium">privacy policy</Link>,{" "}
            <Link href="/dpa" className="text-indigo-600 hover:text-indigo-700 font-medium">data processing agreement</Link>{" "}
            and{" "}
            <Link href="/trust" className="text-indigo-600 hover:text-indigo-700 font-medium">trust and security page</Link>.
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
            <Link href="/trust" className="hover:text-slate-600 transition-colors">Trust</Link>
            <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy</Link>
            <Link href="/auth" className="hover:text-slate-600 transition-colors">Manager Sign In →</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
