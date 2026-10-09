// G1b: public pages are still prerendered after the native work (root layout must not read headers()).
import { readFileSync } from "node:fs";
const routes = Object.keys(JSON.parse(readFileSync(new URL("../../.next/prerender-manifest.json", import.meta.url))).routes);
const mustBeStatic = ["/", "/pricing", "/privacy", "/terms", "/trust", "/dpa"];
const missing = mustBeStatic.filter((r) => !routes.includes(r));
// Positive control: an auth-gated page must NOT be prerendered, proving the manifest distinguishes them.
const control = !routes.includes("/dashboard");
if (missing.length || !control) {
  console.error("FAIL missing static:", missing, "control ok:", control);
  process.exit(1);
}
console.log("STATIC_OK", mustBeStatic.length, "pages");
