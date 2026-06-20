"use client";
import { useEffect, useState } from "react";
import { X, Printer, Loader2 } from "lucide-react";
import QRCode from "qrcode";

export interface PosterLocation {
  uid: string;
  name: string;
}

// One A4 portrait poster per location. Used for both the on-screen preview and
// the print output so they are guaranteed identical.
function posterHTML(name: string, uid: string, qr: string, isLast: boolean): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const brk = isLast ? "page-break-after:avoid;break-after:avoid;" : "page-break-after:always;break-after:page;";
  return `<div style="width:210mm;height:297mm;${brk}box-sizing:border-box;background:white;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24mm;font-family:system-ui,-apple-system,sans-serif;overflow:hidden;">
    <div style="font-size:18pt;font-weight:700;color:#1e293b;letter-spacing:-0.01em;">ScanSolve</div>
    <div style="font-size:34pt;line-height:1.1;font-weight:800;color:#0f172a;margin-top:10mm;text-align:center;">Scan to report an issue</div>
    <div style="font-size:22pt;font-weight:600;color:#4f46e5;margin-top:5mm;text-align:center;">${esc(name)}</div>
    <img src="${qr}" alt="QR code" style="width:115mm;height:115mm;margin:14mm 0;display:block;" />
    <div style="font-size:16pt;color:#334155;text-align:center;max-width:150mm;">Point your phone camera at the code. No app needed.</div>
    <div style="font-size:10pt;color:#94a3b8;margin-top:10mm;font-family:'Courier New',monospace;letter-spacing:0.04em;">${esc(uid)}</div>
  </div>`;
}

interface Props {
  locations: PosterLocation[];
  orgNumber: number;
  appUrl: string;
  onClose: () => void;
}

export function PosterPreviewModal({ locations, orgNumber, appUrl, onClose }: Props) {
  const [qrByUid, setQrByUid] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    (async () => {
      const map: Record<string, string> = {};
      for (const loc of locations) {
        if (cancelled) return;
        map[loc.uid] = await QRCode.toDataURL(`${appUrl}/scan/${orgNumber}/${loc.uid}`, {
          margin: 1,
          width: 800,
          errorCorrectionLevel: "M",
          color: { dark: "#000000", light: "#ffffff" },
        });
      }
      if (!cancelled) {
        setQrByUid(map);
        setReady(true);
      }
    })().catch(console.error);
    return () => { cancelled = true; };
  }, [locations, orgNumber, appUrl]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  function handlePrint() {
    const html = locations
      .map((loc, i) => posterHTML(loc.name, loc.uid, qrByUid[loc.uid] ?? "", i === locations.length - 1))
      .join("");

    const styleEl = document.createElement("style");
    styleEl.id = "ss-poster-print-style";
    styleEl.textContent = `
      @media print {
        @page { size: A4 portrait; margin: 0; }
        body > *:not(#ss-poster-print-root) { display: none !important; visibility: hidden !important; }
        #ss-poster-print-root { display: block !important; visibility: visible !important; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `;
    document.head.appendChild(styleEl);

    const rootEl = document.createElement("div");
    rootEl.id = "ss-poster-print-root";
    rootEl.style.cssText = `position:fixed;top:0;left:0;width:210mm;background:white;z-index:99999;`;
    rootEl.innerHTML = html;
    document.body.appendChild(rootEl);

    const cleanup = () => {
      document.getElementById("ss-poster-print-style")?.remove();
      document.getElementById("ss-poster-print-root")?.remove();
    };
    window.onafterprint = cleanup;
    setTimeout(() => window.print(), 300);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-700/60 backdrop-blur-sm">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 shrink-0 bg-white/95 border-b border-slate-200">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900">Poster preview</h2>
          <p className="text-xs text-slate-500">
            {locations.length} poster{locations.length !== 1 ? "s" : ""} &bull; one A4 page each
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            disabled={!ready}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            {ready ? <Printer className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
            {ready ? "Print / Save PDF" : "Preparing…"}
          </button>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scaled preview */}
      <div className="flex-1 overflow-auto p-6">
        {!ready ? (
          <div className="flex items-center justify-center h-full text-white/90 text-sm gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> Generating QR codes…
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            {locations.map((loc) => (
              <div
                key={loc.uid}
                className="bg-white shadow-2xl"
                style={{ width: 210 * 3.7795 * 0.34, height: 297 * 3.7795 * 0.34, overflow: "hidden" }}
              >
                <div
                  style={{ width: "210mm", height: "297mm", transform: "scale(0.34)", transformOrigin: "top left" }}
                  dangerouslySetInnerHTML={{ __html: posterHTML(loc.name, loc.uid, qrByUid[loc.uid] ?? "", true) }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
