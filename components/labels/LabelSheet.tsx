"use client";
/**
 * LabelSheet — renders one or more A4 Avery label sheets for print preview.
 * Uses inline styles throughout so it works correctly in @media print contexts.
 * QR codes are rendered as <img> data URLs (not canvas) so they print reliably.
 */
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ScanSolveLogoPrint } from "@/components/ui/ScanSolveLogo";

// Avery L7165 dimensions in mm (2 cols × 4 rows, 8 per A4 sheet)
export const SHEET_CONFIGS = {
  avery_l7165: {
    label: "Avery L7165",
    pageWidthMm: 210,
    pageHeightMm: 297,
    marginTopMm: 13.5,
    marginLeftMm: 5.05,
    labelWidthMm: 99.1,
    labelHeightMm: 67.7,
    cols: 2,
    rows: 4,
    labelsPerSheet: 8,
  },
} as const;

// 1 mm ≈ 3.7795 px at 96 dpi (screen)
const MM_TO_PX = 3.7795;

interface LabelSheetProps {
  uids: string[];
  orgNumber: number;
  sheetType?: keyof typeof SHEET_CONFIGS;
  appUrl: string;
  /** Pre-generated QR data URLs keyed by UID. If provided, skips internal generation. */
  qrDataUrls?: Record<string, string>;
}

export function LabelSheet({
  uids,
  orgNumber,
  sheetType = "avery_l7165",
  appUrl,
  qrDataUrls,
}: LabelSheetProps) {
  const cfg = SHEET_CONFIGS[sheetType];
  const labelsPerSheet = cfg.cols * cfg.rows;

  const sheets: string[][] = [];
  for (let i = 0; i < uids.length; i += labelsPerSheet) {
    sheets.push(uids.slice(i, i + labelsPerSheet));
  }

  return (
    <div className="label-print-root">
      {sheets.map((sheetUids, si) => (
        <Sheet
          key={si}
          uids={sheetUids}
          orgNumber={orgNumber}
          cfg={cfg}
          appUrl={appUrl}
          qrDataUrls={qrDataUrls}
          isLast={si === sheets.length - 1}
        />
      ))}
    </div>
  );
}

function Sheet({
  uids,
  orgNumber,
  cfg,
  appUrl,
  qrDataUrls,
  isLast,
}: {
  uids: string[];
  orgNumber: number;
  cfg: (typeof SHEET_CONFIGS)[keyof typeof SHEET_CONFIGS];
  appUrl: string;
  qrDataUrls?: Record<string, string>;
  isLast: boolean;
}) {
  const cells = [...uids];
  while (cells.length < cfg.labelsPerSheet) cells.push("");

  return (
    <div
      className="label-sheet"
      style={{
        width: `${cfg.pageWidthMm}mm`,
        minHeight: `${cfg.pageHeightMm}mm`,
        paddingTop: `${cfg.marginTopMm}mm`,
        paddingLeft: `${cfg.marginLeftMm}mm`,
        boxSizing: "border-box",
        background: "white",
        pageBreakAfter: isLast ? "auto" : "always",
        breakAfter: isLast ? "auto" : "page",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cfg.cols}, ${cfg.labelWidthMm}mm)`,
          gridTemplateRows: `repeat(${cfg.rows}, ${cfg.labelHeightMm}mm)`,
          gap: 0,
        }}
      >
        {cells.map((uid, i) => (
          <LabelCell
            key={i}
            uid={uid}
            orgNumber={orgNumber}
            labelWidthMm={cfg.labelWidthMm}
            labelHeightMm={cfg.labelHeightMm}
            appUrl={appUrl}
            preGeneratedUrl={qrDataUrls?.[uid]}
          />
        ))}
      </div>
    </div>
  );
}

function LabelCell({
  uid,
  orgNumber,
  labelWidthMm,
  labelHeightMm,
  appUrl,
  preGeneratedUrl,
}: {
  uid: string;
  orgNumber: number;
  labelWidthMm: number;
  labelHeightMm: number;
  appUrl: string;
  preGeneratedUrl?: string;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string>(preGeneratedUrl ?? "");
  const qrUrl = uid ? `${appUrl}/scan/${orgNumber}/${uid}` : "";

  // Only self-generate if no pre-generated URL was supplied
  useEffect(() => {
    if (preGeneratedUrl) { setQrDataUrl(preGeneratedUrl); return; }
    if (!qrUrl) return;
    const rightColWidthPx = Math.round(labelWidthMm * 0.6 * MM_TO_PX);
    QRCode.toDataURL(qrUrl, {
      margin: 1,
      width: rightColWidthPx * 4,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [qrUrl, labelWidthMm, preGeneratedUrl]);

  if (!uid) {
    return (
      <div
        style={{
          width: `${labelWidthMm}mm`,
          height: `${labelHeightMm}mm`,
          boxSizing: "border-box",
          border: "0.25mm dashed #e2e8f0",
        }}
      />
    );
  }

  const paddingMm = 3;
  // Left column available width in px (for sizing the logo component)
  const leftColWidthPx = Math.round((labelWidthMm * 0.4 - paddingMm * 2) * MM_TO_PX);

  return (
    <div
      style={{
        width: `${labelWidthMm}mm`,
        height: `${labelHeightMm}mm`,
        boxSizing: "border-box",
        border: "0.25mm solid #e2e8f0",
        display: "flex",
        flexDirection: "row",
        overflow: "hidden",
      }}
    >
      {/* LEFT: Logo + slogan (40%) */}
      <div
        style={{
          width: "40%",
          height: "100%",
          padding: `${paddingMm}mm`,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: `${paddingMm * 0.8}mm`,
          borderRight: "0.25mm solid #e2e8f0",
        }}
      >
        {/* Logo — width passed in px so it fills the available column space */}
        <ScanSolveLogoPrint width={Math.round(leftColWidthPx * 0.82)} />

        {/* Slogan — single line, corporate indigo */}
        <p
          style={{
            margin: 0,
            fontSize: "7pt",
            fontWeight: 700,
            color: "#4f46e5",
            textAlign: "center",
            fontFamily: "system-ui, -apple-system, sans-serif",
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
          }}
        >
          Scan it. Solve it.
        </p>
      </div>

      {/* RIGHT: QR code + UID (60%) */}
      <div
        style={{
          width: "60%",
          height: "100%",
          padding: `${paddingMm}mm`,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: `${paddingMm * 0.5}mm`,
        }}
      >
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`QR code for ${uid}`}
            style={{
              maxWidth: "100%",
              maxHeight: `${labelHeightMm - paddingMm * 2 - 6}mm`,
              width: "auto",
              height: "auto",
              display: "block",
              imageRendering: "crisp-edges",
            }}
          />
        ) : (
          <div
            style={{
              width: `${labelWidthMm * 0.6 * 0.7}mm`,
              height: `${labelWidthMm * 0.6 * 0.7}mm`,
              background: "#f1f5f9",
              borderRadius: 4,
            }}
          />
        )}
        <p
          style={{
            margin: 0,
            fontSize: "5.5pt",
            color: "#000000",
            fontFamily: "ui-monospace, 'Courier New', monospace",
            fontWeight: 500,
            letterSpacing: "0.04em",
            textAlign: "center",
          }}
        >
          {uid}
        </p>
      </div>
    </div>
  );
}
