"use client";
/**
 * LabelSheet — renders one or more A4 Avery label sheets for print preview.
 * Uses inline styles throughout so it works correctly in @media print contexts.
 * QR codes are rendered as <img> data URLs (not canvas) so they print reliably.
 *
 * Geometry + layout come from SHEET_TYPES (lib/labels.ts) so every sheet size
 * renders the same way it prints. Two layouts:
 *   • "split"   — logo column + QR column (wide labels, e.g. L7165)
 *   • "stacked" — logo/brand on top, big QR centred, UID below (square/large/compact)
 */
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { SHEET_TYPES, getSheetConfig, type SheetConfig } from "@/lib/labels";

// Re-export so existing imports keep working
export const SHEET_CONFIGS = SHEET_TYPES;

/** Icon-only ScanSolve mark (rounded indigo square + QR glyph) as an SVG string.
 *  Single source of truth shared by the on-screen preview and the print builder
 *  so the logo is pixel-identical in both. The wordmark is rendered separately. */
export function logoSvgMarkup(sizeMm: number): string {
  return `<svg width="${sizeMm}mm" height="${sizeMm}mm" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="display:block;flex-shrink:0;"><rect width="100" height="100" rx="22" ry="22" fill="#6366f1"/><g transform="translate(16,16) scale(2.8)" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></g></svg>`;
}

function LogoIcon({ sizeMm }: { sizeMm: number }) {
  return <span style={{ display: "inline-flex", flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: logoSvgMarkup(sizeMm) }} />;
}

interface LabelSheetProps {
  uids: string[];
  orgNumber: number;
  sheetType?: string;
  appUrl: string;
  /** Pre-generated QR data URLs keyed by UID. If provided, skips internal generation. */
  qrDataUrls?: Record<string, string>;
}

export function LabelSheet({
  uids,
  orgNumber,
  sheetType,
  appUrl,
  qrDataUrls,
}: LabelSheetProps) {
  const cfg = getSheetConfig(sheetType);
  const labelsPerSheet = cfg.labelsPerSheet;

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
  cfg: SheetConfig;
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
          columnGap: `${cfg.colGapMm}mm`,
          rowGap: `${cfg.rowGapMm}mm`,
        }}
      >
        {cells.map((uid, i) => (
          <LabelCell
            key={i}
            uid={uid}
            orgNumber={orgNumber}
            cfg={cfg}
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
  cfg,
  appUrl,
  preGeneratedUrl,
}: {
  uid: string;
  orgNumber: number;
  cfg: SheetConfig;
  appUrl: string;
  preGeneratedUrl?: string;
}) {
  const { labelWidthMm, labelHeightMm, layout } = cfg;
  const [qrDataUrl, setQrDataUrl] = useState<string>(preGeneratedUrl ?? "");
  const qrUrl = uid ? `${appUrl}/scan/${orgNumber}/${uid}` : "";

  useEffect(() => {
    if (preGeneratedUrl) { setQrDataUrl(preGeneratedUrl); return; }
    if (!qrUrl) return;
    QRCode.toDataURL(qrUrl, {
      margin: 1,
      width: 600,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [qrUrl, preGeneratedUrl]);

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

  return layout === "split"
    ? <SplitCell uid={uid} cfg={cfg} qrDataUrl={qrDataUrl} />
    : <StackedCell uid={uid} cfg={cfg} qrDataUrl={qrDataUrl} />;
}

// ── Wide labels: logo column (40%) + QR column (60%) ──────────────────────
function SplitCell({ uid, cfg, qrDataUrl }: { uid: string; cfg: SheetConfig; qrDataUrl: string }) {
  const { labelWidthMm, labelHeightMm } = cfg;
  const paddingMm = 3;
  const logoBoxMm = +((labelWidthMm * 0.4 - paddingMm * 2) * 0.6).toFixed(1);

  return (
    <div style={cellBox(labelWidthMm, labelHeightMm, { flexDirection: "row" })}>
      <div
        style={{
          width: "40%", height: "100%", padding: `${paddingMm}mm`, boxSizing: "border-box",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: `${paddingMm * 0.8}mm`, borderRight: "0.25mm solid #e2e8f0",
        }}
      >
        <LogoIcon sizeMm={logoBoxMm} />
        <span
          style={{
            fontSize: "7pt", fontWeight: 700, color: "#1e293b",
            fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "-0.01em", lineHeight: 1,
          }}
        >
          ScanSolve
        </span>
        <p style={sloganStyle(6.5)}>Scan it. Solve it.</p>
      </div>
      <div
        style={{
          width: "60%", height: "100%", padding: `${paddingMm}mm`, boxSizing: "border-box",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: `${paddingMm * 0.5}mm`,
        }}
      >
        <QrImg qrDataUrl={qrDataUrl} maxHeightMm={labelHeightMm - paddingMm * 2 - 6} fallbackMm={labelWidthMm * 0.42} />
        <p style={uidStyle(5.5)}>{uid}</p>
      </div>
    </div>
  );
}

// ── Square / large / compact labels: brand on top, big QR, UID below ──────
function StackedCell({ uid, cfg, qrDataUrl }: { uid: string; cfg: SheetConfig; qrDataUrl: string }) {
  const { labelWidthMm, labelHeightMm } = cfg;
  const compact = labelHeightMm < 80;            // L7164 (12-up)
  const showSlogan = labelHeightMm >= 90;        // L7169, L7166
  const paddingMm = compact ? 2.5 : 4;
  const logoBoxMm = +(Math.min(labelHeightMm * 0.12, 9) * (compact ? 1 : 1.1)).toFixed(1);
  const wordmarkPt = compact ? 7 : 9;

  return (
    <div style={cellBox(labelWidthMm, labelHeightMm, { flexDirection: "column", padding: `${paddingMm}mm` })}>
      {/* Brand row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: `${paddingMm * 0.5}mm`, flexShrink: 0 }}>
        <LogoIcon sizeMm={logoBoxMm} />
        <span
          style={{
            fontSize: `${wordmarkPt}pt`, fontWeight: 700, color: "#1e293b",
            fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "-0.01em", lineHeight: 1,
          }}
        >
          ScanSolve
        </span>
      </div>

      {/* QR — fills remaining vertical space */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: `${paddingMm * 0.5}mm 0` }}>
        <QrImg qrDataUrl={qrDataUrl} maxHeightMm={undefined} fallbackMm={labelWidthMm * 0.5} fill />
      </div>

      {showSlogan && <p style={{ ...sloganStyle(7), marginBottom: "1mm" }}>Scan it. Solve it.</p>}
      <p style={{ ...uidStyle(compact ? 5.5 : 6), flexShrink: 0 }}>{uid}</p>
    </div>
  );
}

// ── Shared bits ───────────────────────────────────────────────────────────
function QrImg({
  qrDataUrl, maxHeightMm, fallbackMm, fill,
}: { qrDataUrl: string; maxHeightMm?: number; fallbackMm: number; fill?: boolean }) {
  if (qrDataUrl) {
    return (
      <img
        src={qrDataUrl}
        alt="QR code"
        style={{
          maxWidth: "100%",
          maxHeight: maxHeightMm !== undefined ? `${maxHeightMm}mm` : "100%",
          width: "auto", height: "auto", display: "block",
          imageRendering: "crisp-edges",
          ...(fill ? { objectFit: "contain" as const } : {}),
        }}
      />
    );
  }
  return (
    <div style={{ width: `${fallbackMm}mm`, height: `${fallbackMm}mm`, background: "#f1f5f9", borderRadius: 4 }} />
  );
}

function cellBox(w: number, h: number, extra: React.CSSProperties): React.CSSProperties {
  return {
    width: `${w}mm`, height: `${h}mm`, boxSizing: "border-box",
    border: "0.25mm solid #e2e8f0", display: "flex", overflow: "hidden", ...extra,
  };
}

function sloganStyle(pt: number): React.CSSProperties {
  return {
    margin: 0, fontSize: `${pt}pt`, fontWeight: 700, color: "#4f46e5", textAlign: "center",
    fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "0.02em", whiteSpace: "nowrap",
  };
}

function uidStyle(pt: number): React.CSSProperties {
  return {
    margin: 0, fontSize: `${pt}pt`, color: "#000000",
    fontFamily: "ui-monospace, 'Courier New', monospace", fontWeight: 500,
    letterSpacing: "0.04em", textAlign: "center",
  };
}
