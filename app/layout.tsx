import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { MouseSpotlight } from "@/components/ui/MouseSpotlight";
import { SupportWidget } from "@/components/support/SupportWidget";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// Google AdSense publisher ID (public, permanent). The library is loaded
// site-wide for account/site verification, but ad UNITS only ever render on
// the public reporter page (see components/ui/ReporterAd.tsx) — never on the
// auth-gated dashboard, which AdSense policy does not permit.
const ADSENSE_CLIENT = "ca-pub-7948132881222311";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://scansolve.co";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "ScanSolve — QR Code Facility Issue Reporting",
    template: "%s | ScanSolve",
  },
  description:
    "Place QR codes anywhere in your facility. Staff scan and report issues in seconds — no app or account needed. Managers get instant visibility and can track every issue to resolution.",
  keywords: [
    "ScanSolve",
    "QR code facility management",
    "facility issue reporting",
    "QR maintenance reporting",
    "facilities management software",
    "issue tracking",
    "building maintenance",
    "QR code reporting",
  ],
  authors: [{ name: "ScanSolve", url: APP_URL }],
  creator: "ScanSolve",
  publisher: "ScanSolve",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: APP_URL,
    siteName: "ScanSolve",
    title: "ScanSolve — QR Code Facility Issue Reporting",
    description:
      "Place QR codes anywhere. Staff scan to report issues in seconds. Managers track and resolve everything from one dashboard — no app download required.",
    images: [{ url: `${APP_URL}/og-image.png`, width: 1200, height: 630, alt: "ScanSolve — QR Code Facility Issue Reporting" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ScanSolve — QR Code Facility Issue Reporting",
    description:
      "Place QR codes anywhere. Staff scan to report issues in seconds. Managers track and resolve everything from one dashboard.",
    images: [`${APP_URL}/og-image.png`],
  },
  alternates: {
    canonical: APP_URL,
    languages: { "en-GB": APP_URL },
  },
  verification: {
    google: "iCPMwKAjlmlj-KdcjgemHRTseJ-mIZ1rejTYE7dqUHc",
  },
  other: {
    "theme-color": "#4f46e5",
    // AdSense site verification — renders a verbatim <meta> in <head>
    // (server-side), which Google's verification crawler reads reliably.
    "google-adsense-account": ADSENSE_CLIENT,
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${APP_URL}/#organization`,
      name: "ScanSolve",
      description:
        "ScanSolve provides QR code-based facility issue reporting software that lets staff report problems by scanning a label — no app or login required. Managers track and resolve every issue from a central dashboard.",
      url: APP_URL,
      foundingDate: "2025",
      logo: {
        "@type": "ImageObject",
        "@id": `${APP_URL}/#logo`,
        url: `${APP_URL}/icon.png`,
        width: 512,
        height: 512,
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@scansolve.co",
        availableLanguage: "English",
      },
      sameAs: [
        "https://www.linkedin.com/company/scansolveco",
        "https://www.crunchbase.com/organization/scansolve",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${APP_URL}/#website`,
      url: APP_URL,
      name: "ScanSolve",
      description:
        "QR code facility issue reporting — place a code anywhere, staff report problems in seconds, managers track everything.",
      publisher: { "@id": `${APP_URL}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${APP_URL}/#app`,
      name: "ScanSolve",
      description:
        "Facility issue reporting via QR codes. Place labels anywhere — staff scan to report problems instantly, no login needed. Managers get real-time tracking and notifications.",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: APP_URL,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "GBP",
        description: "Free for founding members — no credit card required.",
      },
      provider: { "@id": `${APP_URL}/#organization` },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans`}>
        {/* AdSense library — loaded at runtime to serve ads. Site verification
            is handled by the google-adsense-account <meta> tag (see metadata),
            not by this script. */}
        <Script
          id="adsbygoogle-lib"
          async
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
        />
        <MouseSpotlight />
        <div className="relative z-10">{children}</div>
        <SupportWidget />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
