"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { X, Printer, Loader2, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import QRCode from "qrcode";
import { LabelSheet, logoSvgMarkup } from "./LabelSheet";
import { getSheetConfig, type SheetConfig } from "@/lib/labels";

// On-screen sheet dimensions (1mm ≈ 3.7795px at 96dpi). Page is always A4.
const MM_TO_PX = 3.7795;
const SHEET_W_PX = 210 * MM_TO_PX;   // ≈ 793.7
const SHEET_H_PX = 297 * MM_TO_PX;   // ≈ 1122.5
const SHEET_GAP_PX = 24;
const MIN_SCALE = 0.2;
const MAX_SCALE = 2;

// Shared logo markup (identical in preview + print)
const logoSvg = logoSvgMarkup;

// ── Build sheet divs (used for both inject-print and matches LabelSheet) ───
function buildSheetsHTML(uids: string[], qrDataUrls: Record<string, string>, cfg: SheetConfig): { html: string; sheetCount: number } {
  const { pageWidthMm: pageW, pageHeightMm: pageH, marginTopMm, marginLeftMm,
    labelWidthMm: labelW, labelHeightMm: labelH, colGapMm, rowGapMm,
    cols, rows, labelsPerSheet, layout } = cfg;

  function emptyLabel() {
    return `<div style="width:${labelW}mm;height:${labelH}mm;border:0.25mm dashed #e2e8f0;box-sizing:border-box;"></div>`;
  }

  // Wide labels: logo column + QR column
  function splitLabel(uid: string) {
    const pad = 3;
    const leftAvailMm = labelW * 0.4 - pad * 2;
    const logoBoxMm = +(leftAvailMm * 0.6).toFixed(1);
    return `<div style="width:${labelW}mm;height:${labelH}mm;box-sizing:border-box;border:0.25mm solid #e2e8f0;display:flex;flex-direction:row;overflow:hidden;"><div style="width:40%;height:100%;padding:${pad}mm;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${+(pad*0.8).toFixed(1)}mm;border-right:0.25mm solid #e2e8f0;">${logoSvg(logoBoxMm)}<span style="font-size:7pt;font-weight:700;color:#1e293b;font-family:system-ui,sans-serif;letter-spacing:-0.01em;line-height:1;">ScanSolve</span><p style="margin:0;font-size:6.5pt;font-weight:700;color:#4f46e5;font-family:system-ui,sans-serif;white-space:nowrap;letter-spacing:0.02em;">Scan it. Solve it.</p></div><div style="width:60%;height:100%;padding:${pad}mm;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${+(pad*0.5).toFixed(1)}mm;"><img src="${qrDataUrls[uid] ?? ""}" style="max-width:100%;max-height:${+(labelH - pad*2 - 6).toFixed(1)}mm;width:auto;height:auto;display:block;" /><p style="margin:0;font-size:5.5pt;color:#000;font-family:'Courier New',monospace;font-weight:500;letter-spacing:0.04em;text-align:center;">${uid}</p></div></div>`;
  }

  // Square / large / compact labels: brand on top, big QR, UID below
  function stackedLabel(uid: string) {
    const compact = labelH < 80;
    const showSlogan = labelH >= 90;
    const pad = compact ? 2.5 : 4;
    const logoBoxMm = +(Math.min(labelH * 0.12, 9) * (compact ? 1 : 1.1)).toFixed(1);
    const wordPt = compact ? 7 : 9;
    const uidPt = compact ? 5.5 : 6;
    const slogan = showSlogan
      ? `<p style="margin:0 0 1mm;font-size:7pt;font-weight:700;color:#4f46e5;font-family:system-ui,sans-serif;white-space:nowrap;letter-spacing:0.02em;text-align:center;">Scan it. Solve it.</p>`
      : "";
    return `<div style="width:${labelW}mm;height:${labelH}mm;box-sizing:border-box;border:0.25mm solid #e2e8f0;display:flex;flex-direction:column;overflow:hidden;padding:${pad}mm;"><div style="display:flex;align-items:center;justify-content:center;gap:${+(pad*0.5).toFixed(1)}mm;flex-shrink:0;">${logoSvg(logoBoxMm)}<span style="font-size:${wordPt}pt;font-weight:700;color:#1e293b;font-family:system-ui,sans-serif;letter-spacing:-0.01em;line-height:1;">ScanSolve</span></div><div style="flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:${+(pad*0.5).toFixed(1)}mm 0;"><img src="${qrDataUrls[uid] ?? ""}" style="max-width:100%;max-height:100%;width:auto;height:auto;display:block;object-fit:contain;" /></div>${slogan}<p style="margin:0;font-size:${uidPt}pt;color:#000;font-family:'Courier New',monospace;font-weight:500;letter-spacing:0.04em;text-align:center;flex-shrink:0;">${uid}</p></div>`;
  }

  const label = (uid: string) => (!uid ? emptyLabel() : layout === "split" ? splitLabel(uid) : stackedLabel(uid));

  function sheet(sheetUids: string[], isLast: boolean) {
    const pageBreak = isLast
      ? "page-break-after:avoid;break-after:avoid;"
      : "page-break-after:always;break-after:page;";
    return `<div style="width:${pageW}mm;height:${pageH}mm;overflow:hidden;padding-top:${marginTopMm}mm;padding-left:${marginLeftMm}mm;box-sizing:border-box;background:white;${pageBreak}"><div style="display:grid;grid-template-columns:repeat(${cols},${labelW}mm);grid-template-rows:repeat(${rows},${labelH}mm);column-gap:${colGapMm}mm;row-gap:${rowGapMm}mm;">${sheetUids.map(label).join("")}</div></div>`;
  }

  const all = [...uids];
  while (all.length % labelsPerSheet !== 0) all.push("");
  const sheets: string[][] = [];
  for (let i = 0; i < all.length; i += labelsPerSheet) sheets.push(all.slice(i, i + labelsPerSheet));

  return { html: sheets.map((s, i) => sheet(s, i === sheets.length - 1)).join(""), sheetCount: sheets.length };
}

// ── Component ──────────────────────────────────────────────────────────────
interface PrintPreviewModalProps {
  uids: string[];
  orgNumber: number;
  sheetType: string;
  appUrl: string;
  onClose: () => void;
}

export function PrintPreviewModal({ uids, orgNumber, sheetType, appUrl, onClose }: PrintPreviewModalProps) {
  const cfg = getSheetConfig(sheetType);
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [qrReady, setQrReady] = useState(false);

  // Zoom / fit-to-screen state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const [userZoomed, setUserZoomed] = useState(false);

  const sheetCount = Math.ceil(uids.length / cfg.labelsPerSheet) || 1;

  // Compute the scale that fits one sheet's width into the viewport
  const computeFit = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return 1;
    const avail = el.clientWidth - 32; // account for padding
    return Math.max(MIN_SCALE, Math.min(1, avail / SHEET_W_PX));
  }, []);

  useEffect(() => {
    const apply = () => {
      const f = computeFit();
      setFitScale(f);
      if (!userZoomed) setScale(f);
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [computeFit, userZoomed]);

  const zoomBy = (delta: number) => {
    setUserZoomed(true);
    setScale((s) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, +(s + delta).toFixed(2))));
  };
  const resetFit = () => { setUserZoomed(false); setScale(fitScale); };

  const scaledW = SHEET_W_PX * scale;
  const scaledH = (sheetCount * SHEET_H_PX + (sheetCount - 1) * SHEET_GAP_PX) * scale;

  // Pre-generate all QR data URLs once (used for both preview and print)
  useEffect(() => {
    let cancelled = false;
    setQrReady(false);
    (async () => {
      const map: Record<string, string> = {};
      for (const uid of uids) {
        if (cancelled) return;
        map[uid] = await QRCode.toDataURL(`${appUrl}/scan/${orgNumber}/${uid}`, {
          margin: 1, width: 600,
          errorCorrectionLevel: "M",
          color: { dark: "#000000", light: "#ffffff" },
        });
      }
      if (!cancelled) { setQrDataUrls(map); setQrReady(true); }
    })().catch(console.error);
    return () => { cancelled = true; };
  }, [uids, orgNumber, appUrl]);

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  function handlePrint() {
    const { html, sheetCount: count } = buildSheetsHTML(uids, qrDataUrls, cfg);
    const totalH = count * cfg.pageHeightMm;

    const styleEl = document.createElement("style");
    styleEl.id = "ss-print-style";
    styleEl.textContent = `
      @media print {
        @page { size: A4 portrait; margin: 0; }
        body > *:not(#ss-print-root) { display: none !important; visibility: hidden !important; }
        #ss-print-root { display: block !important; visibility: visible !important; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `;
    document.head.appendChild(styleEl);

    const rootEl = document.createElement("div");
    rootEl.id = "ss-print-root";
    rootEl.style.cssText = `position:fixed;top:0;left:0;width:${cfg.pageWidthMm}mm;height:${totalH}mm;overflow:hidden;background:white;z-index:99999;font-size:0;line-height:0;`;
    rootEl.innerHTML = html;
    document.body.appendChild(rootEl);

    const cleanup = () => {
      document.getElementById("ss-print-style")?.remove();
      document.getElementById("ss-print-root")?.remove();
    };

    window.onafterprint = cleanup;
    setTimeout(() => window.print(), 300);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-700/60 backdrop-blur-sm" style={{ overflow: "hidden" }}>
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3 px-4 sm:px-5 py-3 shrink-0"
        style={{ background: "rgba(255,255,255,0.95)", borderBottom: "1px solid #e2e8f0" }}>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900">Print Preview</h2>
          <p className="text-xs text-slate-500">
            {uids.length} label{uids.length !== 1 ? "s" : ""} &bull;{" "}
            {sheetCount} sheet{sheetCount !== 1 ? "s" : ""} &bull; {cfg.short} A4
          </p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {/* Zoom controls */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white/80 overflow-hidden">
            <button
              onClick={() => zoomBy(-0.15)}
              disabled={scale <= MIN_SCALE}
              aria-label="Zoom out"
              className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40 transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={resetFit}
              aria-label="Fit to screen"
              className="flex h-9 min-w-[3.25rem] items-center justify-center gap-1 border-x border-slate-200 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={() => zoomBy(0.15)}
              disabled={scale >= MAX_SCALE}
              aria-label="Zoom in"
              className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40 transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handlePrint}
            disabled={!qrReady}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
          >
            {!qrReady
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
              : <><Printer className="h-3.5 w-3.5" /> Send to Printer</>}
          </button>
          <button onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable + zoomable preview — purely for on-screen review */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto flex justify-center py-6 px-4"
        style={{ background: "#94a3b8", touchAction: "pan-x pan-y pinch-zoom" }}
      >
        {/* Sized spacer that reserves the scaled footprint so scrolling works */}
        <div style={{ width: scaledW, height: scaledH, flexShrink: 0, position: "relative" }}>
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: SHEET_W_PX,
              position: "absolute",
              top: 0,
              left: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: SHEET_GAP_PX,
            }}
          >
            <LabelSheet
              uids={uids}
              orgNumber={orgNumber}
              sheetType={sheetType}
              appUrl={appUrl}
              qrDataUrls={qrDataUrls}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
