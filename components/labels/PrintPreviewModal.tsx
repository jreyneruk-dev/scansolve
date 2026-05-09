"use client";
import { useEffect, useState } from "react";
import { X, Printer, Loader2 } from "lucide-react";
import QRCode from "qrcode";
import { LabelSheet } from "./LabelSheet";

// ── Avery L7165 constants (mm) ─────────────────────────────────────────────
const CFG = {
  pageW: 210, pageH: 297,
  marginTop: 13.5, marginLeft: 5.05,
  labelW: 99.1, labelH: 67.7,
  cols: 2, rows: 4,
  labelsPerSheet: 8,
};

// ── QR icon SVG (lucide QrCode path, inlined for print window) ────────────
const QR_ICON = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/>
  <rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
  <path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/>
  <path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/>
  <path d="M21 12v.01"/><path d="M12 21v-1"/>
</svg>`;

// ── Build a complete, self-contained HTML document for printing ────────────
function buildPrintHTML(uids: string[], qrDataUrls: Record<string, string>): string {
  const { pageW, pageH, marginTop, marginLeft, labelW, labelH, labelsPerSheet } = CFG;
  const pad = 3; // mm padding inside each label

  // Left column metrics (40% of labelW minus padding)
  const leftAvailMm = labelW * 0.4 - pad * 2;
  const logoBoxMm   = +(leftAvailMm * 0.68).toFixed(1);
  const iconMm      = +(logoBoxMm  * 0.60).toFixed(1);
  const logoRadMm   = +(logoBoxMm  * 0.22).toFixed(1);

  function label(uid: string) {
    if (!uid) return `<div style="width:${labelW}mm;height:${labelH}mm;border:0.25mm dashed #e2e8f0;box-sizing:border-box;"></div>`;
    return `
<div style="width:${labelW}mm;height:${labelH}mm;box-sizing:border-box;border:0.25mm solid #e2e8f0;display:flex;flex-direction:row;overflow:hidden;">
  <!-- brand column -->
  <div style="width:40%;height:100%;padding:${pad}mm;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${+(pad*0.8).toFixed(1)}mm;border-right:0.25mm solid #e2e8f0;">
    <div style="width:${logoBoxMm}mm;height:${logoBoxMm}mm;background:linear-gradient(135deg,#6366f1 0%,#7c3aed 100%);border-radius:${logoRadMm}mm;display:flex;align-items:center;justify-content:center;padding:${+(logoBoxMm*0.1).toFixed(1)}mm;box-sizing:border-box;">${QR_ICON}</div>
    <span style="font-size:7pt;font-weight:700;color:#1e293b;font-family:system-ui,sans-serif;letter-spacing:-0.01em;line-height:1;">ScanSolve</span>
    <p style="margin:0;font-size:6.5pt;font-weight:700;color:#4f46e5;font-family:system-ui,sans-serif;white-space:nowrap;letter-spacing:0.01em;">Scan it. Solve it.</p>
  </div>
  <!-- qr column -->
  <div style="width:60%;height:100%;padding:${pad}mm;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${+(pad*0.4).toFixed(1)}mm;">
    <img src="${qrDataUrls[uid] ?? ""}" style="max-width:100%;max-height:${+(labelH - pad*2 - 5).toFixed(1)}mm;width:auto;height:auto;display:block;" />
    <p style="margin:0;font-size:5.5pt;color:#000;font-family:'Courier New',monospace;font-weight:500;letter-spacing:0.04em;text-align:center;">${uid}</p>
  </div>
</div>`;
  }

  function sheet(sheetUids: string[], isLast: boolean) {
    const pageBreak = isLast ? "" : "page-break-after:always;break-after:page;";
    return `
<div style="width:${pageW}mm;min-height:${pageH}mm;padding-top:${marginTop}mm;padding-left:${marginLeft}mm;box-sizing:border-box;background:white;${pageBreak}">
  <div style="display:grid;grid-template-columns:${labelW}mm ${labelW}mm;grid-template-rows:${labelH}mm ${labelH}mm ${labelH}mm ${labelH}mm;gap:0;">
    ${sheetUids.map(label).join("")}
  </div>
</div>`;
  }

  // Pad to full sheets
  const all = [...uids];
  while (all.length % labelsPerSheet !== 0) all.push("");

  const sheets: string[][] = [];
  for (let i = 0; i < all.length; i += labelsPerSheet) sheets.push(all.slice(i, i + labelsPerSheet));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>ScanSolve Labels</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    html, body { margin: 0; padding: 0; background: white; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
${sheets.map((s, i) => sheet(s, i === sheets.length - 1)).join("\n")}
</body>
</html>`;
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
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [qrReady, setQrReady] = useState(false);

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
    // Open a clean, dedicated window — zero interference from React/Tailwind/browser chrome
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) { alert("Please allow pop-ups for this site to print."); return; }
    win.document.open();
    win.document.write(buildPrintHTML(uids, qrDataUrls));
    win.document.close();
    // Wait for images to load before triggering print
    win.addEventListener("load", () => setTimeout(() => { win.print(); win.close(); }, 400));
  }

  const sheetCount = Math.ceil(uids.length / CFG.labelsPerSheet);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-700/60 backdrop-blur-sm" style={{ overflow: "hidden" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{ background: "rgba(255,255,255,0.95)", borderBottom: "1px solid #e2e8f0" }}>
        <div>
          <h2 className="text-sm font-bold text-slate-900">Print Preview</h2>
          <p className="text-xs text-slate-500">
            {uids.length} label{uids.length !== 1 ? "s" : ""} &bull;{" "}
            {sheetCount} sheet{sheetCount !== 1 ? "s" : ""} &bull; Avery L7165 A4
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Scrollable preview — purely for on-screen review */}
      <div className="flex-1 overflow-auto flex justify-center py-6" style={{ background: "#94a3b8" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          <LabelSheet
            uids={uids}
            orgNumber={orgNumber}
            sheetType="avery_l7165"
            appUrl={appUrl}
            qrDataUrls={qrDataUrls}
          />
        </div>
      </div>
    </div>
  );
}
