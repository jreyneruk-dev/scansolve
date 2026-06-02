"use client";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f8fafc" }}>
        <div style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}>
          <div style={{ maxWidth: 360, width: "100%", textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: 24,
              background: "#fef2f2", border: "1px solid #fee2e2",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px", lineHeight: 1.6 }}>
              An unexpected error occurred. Please try again — if it keeps happening, contact support.
            </p>
            <button
              onClick={reset}
              style={{
                display: "block", width: "100%", padding: "14px",
                borderRadius: 16, border: "none", cursor: "pointer",
                background: "linear-gradient(to right, #4f46e5, #7c3aed)",
                color: "#fff", fontWeight: 600, fontSize: 14,
                marginBottom: 12,
              }}
            >
              Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error has its own html/body, Next.js Link is unavailable here */}
            <a href="/" style={{ fontSize: 13, color: "#94a3b8", textDecoration: "none" }}>
              Back to home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
