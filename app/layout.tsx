import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { MouseSpotlight } from "@/components/ui/MouseSpotlight";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ScanSolve",
  description: "Scan to report facilities issues instantly",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <MouseSpotlight />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
