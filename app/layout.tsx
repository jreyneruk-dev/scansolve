import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { MouseSpotlight } from "@/components/ui/MouseSpotlight";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
  },
  twitter: {
    card: "summary_large_image",
    title: "ScanSolve — QR Code Facility Issue Reporting",
    description:
      "Place QR codes anywhere. Staff scan to report issues in seconds. Managers track and resolve everything from one dashboard.",
    site: "@scansolve",
  },
  alternates: {
    canonical: APP_URL,
  },
  verification: {
    google: "iCPMwKAjlmlj-KdcjgemHRTseJ-mIZ1rejTYE7dqUHc",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${APP_URL}/#organization`,
      name: "ScanSolve",
      url: APP_URL,
      logo: {
        "@type": "ImageObject",
        url: `${APP_URL}/icon.png`,
      },
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": `${APP_URL}/#website`,
      url: APP_URL,
      name: "ScanSolve",
      description:
        "QR code facility issue reporting — place a code anywhere, staff report problems in seconds, managers track everything.",
      publisher: { "@id": `${APP_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${APP_URL}/dashboard?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
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
        <MouseSpotlight />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
