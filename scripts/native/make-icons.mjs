// Renders the store-app icon sources (no alpha, as Apple requires) from the brand
// mark: indigo→violet gradient with the lucide QR glyph. Output feeds @capacitor/assets.
import sharp from "sharp";

const glyph = (stroke) => `
  <g fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/>
    <rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/>
    <path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/>
    <path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>
  </g>`;
const gradient = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs>`;

// glyphScale: share of the canvas the 24-unit glyph covers.
const svg = (size, { bg = true, glyphScale = 0.5, stroke = "#ffffff" } = {}) => {
  const s = (size * glyphScale) / 24, off = (size - 24 * s) / 2;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${gradient}${bg ? `<rect width="${size}" height="${size}" fill="url(#g)"/>` : ""}
    <g transform="translate(${off} ${off}) scale(${s})">${glyph(stroke)}</g></svg>`);
};
const out = (name) => new URL(`../../mobile/assets/${name}`, import.meta.url).pathname;

await sharp(svg(1024)).flatten({ background: "#6366f1" }).removeAlpha().png().toFile(out("icon-only.png"));
// Android adaptive icon: foreground keeps the glyph inside the 66% safe zone.
await sharp(svg(1024, { bg: false, glyphScale: 0.42 })).png().toFile(out("icon-foreground.png"));
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">${gradient}<rect width="1024" height="1024" fill="url(#g)"/></svg>`)).png().toFile(out("icon-background.png"));
// Splash: slate-50 with a small gradient tile, matching the web app's loading look.
const tile = await sharp(svg(512, { glyphScale: 0.55 })).png().toBuffer();
const rounded = await sharp(tile).composite([{ input: Buffer.from(`<svg width="512" height="512"><rect width="512" height="512" rx="112" fill="#fff"/></svg>`), blend: "dest-in" }]).png().toBuffer();
for (const [name, bg] of [["splash.png", "#f8fafc"], ["splash-dark.png", "#0f172a"]]) {
  await sharp({ create: { width: 2732, height: 2732, channels: 3, background: bg } })
    .composite([{ input: await sharp(rounded).resize(420, 420).toBuffer(), gravity: "center" }])
    .png().toFile(out(name));
}
console.log("ICONS_OK");
