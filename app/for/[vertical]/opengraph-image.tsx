import { ImageResponse } from "next/og";
import { VERTICALS, getVertical } from "@/lib/verticals";

export const alt = "ScanSolve — QR code facility issue reporting";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return VERTICALS.map((v) => ({ vertical: v.slug }));
}

// Per-vertical social card, generated in-repo (no image tool). On-brand indigo→violet.
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ vertical: string }>;
}) {
  const { vertical } = await params;
  const v = getVertical(vertical);
  const eyebrow = v?.eyebrow ?? "ScanSolve";
  const headline = v?.headline ?? "QR code facility issue reporting";

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
              fontSize: 24,
            }}
          >
            ▦
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
          scansolve.co · Issues fixed, not forgotten.
        </div>
      </div>
    ),
    { ...size },
  );
}
