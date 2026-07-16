// Parametric on-brand hero generator for /for/[vertical] pages.
//
// Usage (run from the repo root so `qrcode` resolves):
//   node scripts/gen-vertical-hero.cjs <slug> <url> "<location>" "<sublocation>" "<fault1>" "<fault2>" "<fault3>"
// Example:
//   node scripts/gen-vertical-hero.cjs retail https://scansolve.co/for/retail "Chiller 3" "Shop floor" "Not cold" "Door won't seal" "Light out"
//
// Writes public/verticals/<slug>-hero.svg — a printed ScanSolve QR label (real,
// scannable matrix) beside a phone running the report form, connected by the scan.
// Vertical flavour comes only from the location + faults + QR target; the composition
// is identical across verticals for brand consistency.
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}

function qrRects(url, x0, y0, size){
  const qr = QRCode.create(url, {errorCorrectionLevel:"M"});
  const n = qr.modules.size, data = qr.modules.data, cell = size/n, ov = 0.4;
  let r = "";
  for(let i=0;i<n;i++) for(let j=0;j<n;j++) if(data[i*n+j])
    r += `<rect x="${(x0+j*cell).toFixed(2)}" y="${(y0+i*cell).toFixed(2)}" width="${(cell+ov).toFixed(2)}" height="${(cell+ov).toFixed(2)}"/>`;
  return r;
}

function chip(y, text, selected){
  const w = Math.max(96, Math.round(text.length*7.1)+40);
  if(selected) return `<rect x="632" y="${y}" width="${w}" height="34" rx="17" fill="url(#brand)"/><text x="652" y="${y+22}" font-size="13" font-weight="600" fill="#fff">${esc(text)}</text>`;
  return `<rect x="632" y="${y}" width="${w}" height="34" rx="17" fill="#f8fafc" stroke="#e6ebf3"/><text x="652" y="${y+22}" font-size="13" fill="#475569">${esc(text)}</text>`;
}

function heroSVG({url, location, sublocation, faults}){
  const qr = qrRects(url, 164, 250, 170);
  return `<svg viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="ttl desc">
  <title id="ttl">Scan a ScanSolve QR label, report a fault on your phone</title>
  <desc id="desc">A printed ScanSolve QR label beside a phone showing the report form for ${esc(location)}.</desc>
  <style>text{font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;}</style>
  <defs>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f46e5"/><stop offset="1" stop-color="#7c3aed"/></linearGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef2ff"/><stop offset="1" stop-color="#f4f0ff"/></linearGradient>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#312e81" flood-opacity="0.18"/></filter>
    <filter id="blur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="46"/></filter>
  </defs>
  <rect width="1000" height="600" fill="url(#bg)"/>
  <circle cx="885" cy="95" r="165" fill="#a5b4fc" opacity="0.22" filter="url(#blur)"/>
  <circle cx="115" cy="520" r="150" fill="#c4b5fd" opacity="0.18" filter="url(#blur)"/>
  <ellipse cx="742" cy="548" rx="140" ry="16" fill="#0b1220" opacity="0.10"/>
  <ellipse cx="250" cy="478" rx="108" ry="12" fill="#4f46e5" opacity="0.07"/>
  <path d="M356 236 C 440 180, 520 168, 600 184" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="1 9" opacity="0.55"/>
  <circle cx="600" cy="184" r="7" fill="#10b981"/>
  <path d="M596 184 l3 3 l6 -7" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  <g transform="rotate(-7 250 320)" filter="url(#soft)">
    <rect x="126" y="176" width="248" height="288" rx="22" fill="#ffffff"/>
    <rect x="152" y="200" width="28" height="28" rx="8" fill="url(#brand)"/>
    <g fill="#fff"><rect x="158" y="206" width="6" height="6" rx="1"/><rect x="168" y="206" width="6" height="6" rx="1"/><rect x="158" y="216" width="6" height="6" rx="1"/><rect x="168" y="216" width="6" height="6" rx="1"/></g>
    <text x="190" y="221" font-size="15" font-weight="700" fill="#0f172a">ScanSolve</text>
    <g fill="#0f172a" shape-rendering="crispEdges">${qr}</g>
    <text x="250" y="436" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="2" fill="#64748b">SCAN TO REPORT</text>
  </g>
  <g filter="url(#soft)">
    <rect x="592" y="70" width="300" height="470" rx="44" fill="#0b1220"/>
    <rect x="608" y="86" width="268" height="438" rx="30" fill="#ffffff"/>
    <rect x="712" y="100" width="56" height="10" rx="5" fill="#0b1220"/>
  </g>
  <rect x="632" y="118" width="28" height="28" rx="8" fill="url(#brand)"/>
  <g fill="#fff"><rect x="638" y="124" width="6" height="6" rx="1"/><rect x="648" y="124" width="6" height="6" rx="1"/><rect x="638" y="134" width="6" height="6" rx="1"/><rect x="648" y="134" width="6" height="6" rx="1"/></g>
  <text x="670" y="131" font-size="15" font-weight="700" fill="#0f172a">${esc(location)}</text>
  <text x="670" y="148" font-size="11" fill="#94a3b8">${esc(sublocation)}</text>
  <line x1="632" y1="164" x2="852" y2="164" stroke="#eef2ff" stroke-width="1.5"/>
  <text x="632" y="192" font-size="16" font-weight="700" fill="#0f172a">What needs fixing?</text>
  ${chip(206, faults[0], true)}
  ${chip(248, faults[1], false)}
  ${chip(290, faults[2], false)}
  <rect x="632" y="338" width="220" height="70" rx="12" fill="#f8fafc" stroke="#e6ebf3"/>
  <g stroke="#cbd5e1" stroke-width="3" fill="none" stroke-linejoin="round"><path d="M700 390 l18 -20 l14 14 l10 -8 l16 16"/></g>
  <circle cx="704" cy="362" r="5" fill="#cbd5e1"/>
  <rect x="632" y="430" width="220" height="46" rx="14" fill="url(#brand)"/>
  <text x="742" y="459" text-anchor="middle" font-size="15" font-weight="700" fill="#fff">Send report</text>
</svg>
`;
}

const [,, slug, url, location, sublocation, f1, f2, f3] = process.argv;
if(!slug || !url || !location || !sublocation || !f1 || !f2 || !f3){
  console.error('Usage: node scripts/gen-vertical-hero.cjs <slug> <url> "<location>" "<sublocation>" "<fault1>" "<fault2>" "<fault3>"');
  process.exit(1);
}
const out = path.join("public/verticals", `${slug}-hero.svg`);
fs.writeFileSync(out, heroSVG({url, location, sublocation, faults:[f1,f2,f3]}));
console.log(`wrote ${out}`);
