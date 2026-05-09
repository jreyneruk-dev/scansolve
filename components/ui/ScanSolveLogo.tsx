"use client";
import { QrCode } from "lucide-react";

interface ScanSolveLogoProps {
  /** "sm" = nav bar size, "md" = page header, "lg" = onboarding/auth hero */
  size?: "sm" | "md" | "lg";
  /** Show the "ScanSolve" wordmark next to the icon */
  showWordmark?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { container: "h-8 w-8 rounded-xl shadow-md shadow-indigo-500/20", icon: "h-4 w-4" },
  md: { container: "h-12 w-12 rounded-2xl shadow-lg shadow-indigo-500/25", icon: "h-6 w-6" },
  lg: { container: "h-16 w-16 rounded-3xl shadow-2xl shadow-indigo-500/30", icon: "h-8 w-8" },
};

const wordmarkSize = {
  sm: "text-sm font-bold tracking-tight",
  md: "text-lg font-bold tracking-tight",
  lg: "text-2xl font-bold",
};

/**
 * Single canonical ScanSolve logo mark.
 * Used in DashboardNav, auth pages, commission page, scan page, and printed labels.
 * Update branding here and it propagates everywhere.
 */
export function ScanSolveLogo({
  size = "sm",
  showWordmark = true,
  className = "",
}: ScanSolveLogoProps) {
  const s = sizeMap[size];
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`flex shrink-0 items-center justify-center ${s.container} bg-gradient-to-br from-indigo-500 to-violet-600`}
      >
        <QrCode className={`${s.icon} text-white`} />
      </span>
      {showWordmark && (
        <span className={`${wordmarkSize[size]} text-slate-900`}>ScanSolve</span>
      )}
    </span>
  );
}

/**
 * Print-safe version — renders as plain HTML/SVG-compatible elements
 * with no Tailwind classes that might not be available in print context.
 * Used inside the label print preview.
 */
export function ScanSolveLogoPrint({ width = 80 }: { width?: number }) {
  const iconSize = Math.round(width * 0.45);
  const containerSize = Math.round(width * 0.72);
  const fontSize = Math.round(width * 0.18);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      {/* Gradient box */}
      <div
        style={{
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize * 0.22,
          background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {/* QR icon as inline SVG so it renders in print without lucide deps */}
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="5" height="5" x="3" y="3" rx="1" />
          <rect width="5" height="5" x="16" y="3" rx="1" />
          <rect width="5" height="5" x="3" y="16" rx="1" />
          <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
          <path d="M21 21v.01" />
          <path d="M12 7v3a2 2 0 0 1-2 2H7" />
          <path d="M3 12h.01" />
          <path d="M12 3h.01" />
          <path d="M12 16v.01" />
          <path d="M16 12h1" />
          <path d="M21 12v.01" />
          <path d="M12 21v-1" />
        </svg>
      </div>

      {/* Wordmark */}
      <span
        style={{
          fontSize,
          fontWeight: 700,
          color: "#1e293b",
          letterSpacing: "-0.02em",
          fontFamily: "system-ui, -apple-system, sans-serif",
          lineHeight: 1,
        }}
      >
        ScanSolve
      </span>
    </div>
  );
}
