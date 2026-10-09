// G3: marketing, pricing, billing and checkout are unreachable from the store app.
import { get, send, fail, NATIVE_UA, DESKTOP_UA } from "./_helpers.mjs";
for (const p of ["/", "/pricing", "/dashboard/billing"]) {
  const r = await get(p, { ua: NATIVE_UA });
  const loc = r.headers.get("location") ?? "";
  if (![307, 308].includes(r.status) || new URL(loc, "http://x").pathname !== "/dashboard") fail(`${p} → ${r.status} ${loc}`);
}
const co = await send("POST", "/api/stripe/checkout", {}, { ua: NATIVE_UA });
if (co.status !== 403) fail(`checkout native → ${co.status}`);
// Positive control: the web still gets pricing.
const web = await get("/pricing", { ua: DESKTOP_UA });
if (web.status !== 200) fail(`desktop /pricing → ${web.status}`);
if (!process.exitCode) console.log("REDIRECTS_OK");
