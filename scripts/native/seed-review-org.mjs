// Creates (or refreshes) the App Store / Play review account and its demo organisation.
// Idempotent. Prints the env lines to add locally and in Vercel; the code is written to
// .env.local only, never printed. Usage: node scripts/native/seed-review-org.mjs
import { readFileSync, appendFileSync } from "node:fs";
import { randomInt } from "node:crypto";
import { service } from "./_helpers.mjs";

const EMAIL = (process.env.REVIEW_EMAIL ?? "appreview@scansolve.co").toLowerCase();
const envPath = new URL("../../.env.local", import.meta.url);

let { data: list } = await service.auth.admin.listUsers({ perPage: 1000 });
let user = list.users.find((u) => u.email === EMAIL);
if (!user) user = (await service.auth.admin.createUser({ email: EMAIL, email_confirm: true })).data.user;

let { data: org } = await service.from("organizations").select("*").eq("owner_id", user.id).maybeSingle();
if (!org) {
  ({ data: org } = await service.from("organizations")
    .insert({ name: "ScanSolve Demo", owner_id: user.id, plan: "prime", plan_source: "comp" }).select().single());
  await service.from("org_members").insert({ org_id: org.id, user_id: user.id, role: "owner" });
}

// Fresh demo data each run.
await service.from("issues").delete().eq("org_id", org.id);
await service.from("locations").delete().eq("org_id", org.id);
const cats = ["Lighting", "Leak", "Broken equipment", "Cleaning"];
const places = ["Reception", "Gym floor", "Changing room B", "Car park entrance"];
const { data: locs } = await service.from("locations").insert(
  places.map((name, i) => ({ org_id: org.id, uid: `9${org.id.replace(/\D/g, "").slice(0, 6)}${i}`, name, survey_config: { categories: cats, fields: { description: { enabled: true, required: false }, photo: { enabled: true, required: false }, contact: { enabled: true, required: false } }, success_message: "Thanks, we're on it." } }))
).select();
const statuses = ["reported", "assigned", "in_progress", "resolved"];
await service.from("issues").insert(locs.map((l, i) => ({
  org_id: org.id, location_id: l.id, category: cats[i], status: statuses[i],
  description: ["Flickering light above the desk", "Water pooling under the sink", "Treadmill 3 belt slipping", "Bin overflowing"][i],
  ...(statuses[i] === "resolved" ? { resolved_at: new Date().toISOString() } : {}),
})));
await service.from("issues").insert({ org_id: org.id, location_text: "Side gate by the bike racks", category: "Broken equipment", status: "reported", description: "Gate latch broken", created_by: user.id });

const env = readFileSync(envPath, "utf8");
const lines = [];
if (!/^REVIEW_EMAIL=/m.test(env)) lines.push(`REVIEW_EMAIL=${EMAIL}`);
if (!/^REVIEW_CODE=/m.test(env)) lines.push(`REVIEW_CODE=${String(randomInt(10_000_000, 99_999_999))}`);
if (!/^REVIEW_ORG_ID=/m.test(env)) lines.push(`REVIEW_ORG_ID=${org.id}`);
if (lines.length) appendFileSync(envPath, `\n# App Store / Play review account (also set in Vercel)\n${lines.join("\n")}\n`);
console.log(`SEEDED org=${org.id} user=${EMAIL} locations=${locs.length} issues=5 env_added=${lines.map((l) => l.split("=")[0]).join(",") || "none"}`);
