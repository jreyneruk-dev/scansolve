import { ImageResponse } from "next/og";
import { COMPARISONS, getComparison } from "@/lib/comparisons";

export const alt = "ScanSolve comparison";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ competitor: c.slug }));
}

// Per-comparison social card, generated in-repo (no image tool). On-brand indigo→violet.
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ competitor: string }>;
}) {
  const { competitor } = await params;
  const c = getComparison(competitor);
  const eyebrow = c ? `ScanSolve vs ${c.competitor}` : "ScanSolve";
  const headline = c?.headline ?? "Compare ScanSolve";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 700 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
            }}
          >
            <div style={{ width: 20, height: 20, borderRadius: 5, background: "#ffffff" }} />
          </div>
          ScanSolve
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 2,
              color: "#c7d2fe",
              marginBottom: 20,
            }}
          >
            {eyebrow}
          </div>
          <div style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.1, maxWidth: 1000 }}>
            {headline}
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 26, color: "#e0e7ff" }}>
          scansolve.co · Flat price, no per-seat tax.
        </div>
      </div>
    ),
    { ...size },
  );
}
