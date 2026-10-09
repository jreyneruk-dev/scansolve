// G4: the review account signs in only with the right code, only while confined to the demo org,
// and the feature is off when its env vars are missing.
import { send, get, service, makeOrg, cleanup, fail } from "./_helpers.mjs";

const email = process.env.REVIEW_EMAIL?.toLowerCase();
const code = process.env.REVIEW_CODE;
const demoOrg = process.env.REVIEW_ORG_ID;
if (!email || !code || !demoOrg) { console.error("FAIL: REVIEW_* not set in .env.local (run seed-review-org.mjs)"); process.exit(1); }

try {
  // Off without config (library level — the running server has config).
  const saved = process.env.REVIEW_CODE;
  delete process.env.REVIEW_CODE;
  const { reviewConfig } = await import("../../lib/review-account.ts");
  if (reviewConfig() !== null) fail("review login is on without REVIEW_CODE");
  process.env.REVIEW_CODE = saved;

  const ml = await send("POST", "/api/auth/magic-link", { email });
  if ((await ml.json()).review !== true) fail("magic-link didn't flag the review email");

  const wrongCode = String((Number(code) + 1) % 1e8).padStart(8, "0");
  const bad = await send("POST", "/api/auth/review-login", { email, code: wrongCode });
  if (bad.status !== 401) fail(`wrong code → ${bad.status}`);
  const otherEmail = await send("POST", "/api/auth/review-login", { email: "someone@example.com", code });
  if (otherEmail.status !== 401) fail(`right code, wrong email → ${otherEmail.status}`);

  const good = await send("POST", "/api/auth/review-login", { email, code });
  const cookies = good.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  if (good.status !== 200 || !cookies.includes("auth-token")) fail(`right code → ${good.status}, cookie=${!!cookies}`);
  const dash = await get("/dashboard", { cookie: cookies });
  if (dash.status !== 200) fail(`dashboard with review session → ${dash.status}`);

  // Confinement: once the review user also belongs to a second org, sign-in is refused.
  const { data: list } = await service.auth.admin.listUsers({ perPage: 1000 });
  const reviewUser = list.users.find((u) => u.email === email);
  const extra = await makeOrg({ id: reviewUser.id }, "free");
  const refused = await send("POST", "/api/auth/review-login", { email, code });
  if (refused.status !== 503) fail(`second org → ${refused.status}, expected refusal`);
  await service.from("organizations").delete().eq("id", extra.id);

  if (!process.exitCode) console.log("REVIEW_LOGIN_OK");
} finally {
  await cleanup();
}
