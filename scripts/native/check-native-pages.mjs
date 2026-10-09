// G2: no upsell reaches the store app on any staff page; the same pages DO show it on desktop.
import { makeUser, makeOrg, sessionCookie, get, cleanup, fail, NATIVE_UA, DESKTOP_UA } from "./_helpers.mjs";

const UPSELL = /href="\/pricing"|href="\/dashboard\/billing"|Upgrade to Prime|>Upgrade|£\d/;
const PAGES = ["/dashboard", "/dashboard/insights", "/dashboard/labels", "/dashboard/settings"];

try {
  const owner = await makeUser("pages");
  await makeOrg(owner, "free");
  const cookie = await sessionCookie(owner.email);
  let desktopHits = 0;
  for (const p of PAGES) {
    const [n, d] = await Promise.all([get(p, { cookie, ua: NATIVE_UA }), get(p, { cookie, ua: DESKTOP_UA })]);
    if (n.status !== 200 || d.status !== 200) { fail(`${p} status native=${n.status} desktop=${d.status}`); continue; }
    const [nh, dh] = await Promise.all([n.text(), d.text()]);
    const hit = UPSELL.exec(nh);
    if (hit) fail(`${p} native shows upsell: ${hit[0]}`);
    if (UPSELL.test(dh)) desktopHits++;
  }
  // Positive control: free-plan desktop pages must show upsell, or the regex proves nothing.
  if (desktopHits < 3) fail(`desktop control only matched ${desktopHits}/${PAGES.length} pages`);
  if (!process.exitCode) console.log(`NATIVE_CLEAN desktop_control=pass (${desktopHits}/${PAGES.length})`);
} finally {
  await cleanup();
}
