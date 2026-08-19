import type { Metadata } from "next";
import Link from "next/link";
import { QrCode, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description:
    "ScanSolve is QR-code maintenance reporting, founded in 2025. Place a label, staff scan to report a fault, managers track the work order to resolution — no app needed.",
  openGraph: {
    title: "About ScanSolve",
    description:
      "QR-code maintenance reporting. Place a label, staff scan to report a fault, managers track it to resolution.",
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://scansolve.co"}/about`,
    siteName: "ScanSolve",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ScanSolve" }],
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://scansolve.co"}/about`,
  },
};

export default function AboutPage() {
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
          <Link
            href="/auth"
            className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Sign in <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>

      {/* Content */}
      <article className="max-w-3xl mx-auto px-6 py-16">
        <header className="mb-12">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-3">About</p>
          <h1 className="text-4xl font-bold text-slate-900 mb-5">About ScanSolve</h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            ScanSolve is a QR code facility issue reporting platform designed to close the gap between a problem being spotted and a manager knowing about it.
          </p>
        </header>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-600 leading-relaxed">
          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">The problem we solve</h2>
          <p>
            In most facilities, maintenance reporting relies on phone calls, paper sheets, or staff remembering to tell someone. Issues get missed. Response times are slow. Managers have no clear picture of what is happening across their sites until something breaks badly enough that someone complains loudly.
          </p>
          <p>
            ScanSolve was founded in 2025 to fix this. The core idea is simple: put a QR code label anywhere a problem might occur, and give anyone on site a frictionless way to report it in under a minute — with no app to download and no account to create.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">How ScanSolve works</h2>
          <p>
            Facility managers sign up and use the ScanSolve dashboard to create their locations and generate QR code labels. Labels are printed on standard Avery sheets and placed at relevant points around the building — a plant room door, a piece of gym equipment, a hotel room, a toilet cubicle, a shared office printer.
          </p>
          <p>
            When a member of staff, a tenant, a guest, or a visitor spots a problem, they point their phone camera at the nearest ScanSolve label. Their browser opens a simple reporting form. They pick a category, optionally add a description or photo, and submit. The whole process takes under a minute. No app download. No login required.
          </p>
          <p>
            The report appears instantly in the manager&apos;s dashboard. They can assign it to a team member by email, update its status — Assigned, In Progress, Resolved — and everything is tracked in one place. Email notifications keep everyone informed at each step.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">Who uses ScanSolve</h2>
          <p>ScanSolve is built for anyone responsible for keeping a site running:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Facilities managers and building managers</li>
            <li>Office managers in multi-tenant buildings</li>
            <li>Hotel and hospitality operations teams</li>
            <li>Gym and leisure centre operators</li>
            <li>School and university site managers</li>
            <li>Retail store and shop floor managers</li>
            <li>Rail and transport operators</li>
            <li>Residential block and estate management companies</li>
            <li>FM (facilities management) companies overseeing multiple sites</li>
          </ul>
          <p>
            ScanSolve is especially powerful for multi-site groups who need consistent maintenance standards across multiple locations without deploying a complex enterprise system.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">Founding membership</h2>
          <p>
            ScanSolve is currently in its founding member phase. Founding membership is free — no credit card required and no time pressure. Founding members get full access during the early access period, and their feedback directly shapes what gets built next.
          </p>
          <p>
            If you manage a facility and want a faster, cleaner way to track and resolve maintenance issues, ScanSolve was built for you.
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100">
          <Link
            href="/auth?mode=signup"
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 transition-all duration-200"
          >
            Start Free — No Card Needed
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </article>

      {/* Footer */}
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
            <Link href="/terms" className="hover:text-slate-600 transition-colors">Terms</Link>
            <Link href="/trust" className="hover:text-slate-600 transition-colors">Trust</Link>
            <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy</Link>
            <Link href="/auth" className="hover:text-slate-600 transition-colors">Manager Sign In →</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
