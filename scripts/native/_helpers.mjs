// Shared helpers for the native-app gate checks. They run against the local
// dev server (BASE, default http://localhost:3000) and the Supabase project in
// .env.local, creating throwaway users/orgs that each check deletes again.
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

for (const line of readFileSync(new URL("../../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

export const BASE = process.env.CHECK_BASE ?? "http://localhost:3000";
export const NATIVE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 ScanSolveApp/1";
export const DESKTOP_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Safari/605.1.15";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const service = createClient(URL_, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
export const anon = () => createClient(URL_, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

const created = { users: [], orgs: [] };

/** A throwaway confirmed user. */
export async function makeUser(tag = "check") {
  const email = `native-${tag}-${randomBytes(4).toString("hex")}@example.com`;
  const { data, error } = await service.auth.admin.createUser({ email, email_confirm: true });
  if (error) throw error;
  created.users.push(data.user.id);
  return { id: data.user.id, email };
}

/** A throwaway org owned by `owner`, on `plan`. */
export async function makeOrg(owner, plan = "free", name = `Native check ${randomBytes(3).toString("hex")}`) {
  const { data: org, error } = await service
    .from("organizations")
    .insert({ name, owner_id: owner.id, plan, plan_source: plan === "free" ? "free" : "comp" })
    .select()
    .single();
  if (error) throw error;
  created.orgs.push(org.id);
  const { error: mErr } = await service.from("org_members").insert({ org_id: org.id, user_id: owner.id, role: "owner" });
  if (mErr) throw mErr;
  return org;
}

/** Cookie header for a signed-in session, produced by @supabase/ssr itself (same format the app reads). */
export async function sessionCookie(email) {
  const { data: link, error } = await service.auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw error;
  const { data: verified, error: vErr } = await anon().auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
  if (vErr) throw vErr;
  const jar = new Map();
  const ssr = createServerClient(URL_, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (c) => c.forEach(({ name, value }) => jar.set(name, value)) },
  });
  await ssr.auth.setSession({ access_token: verified.session.access_token, refresh_token: verified.session.refresh_token });
  return [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
}

export async function get(path, { cookie, ua = DESKTOP_UA } = {}) {
  return fetch(BASE + path, { redirect: "manual", headers: { "user-agent": ua, ...(cookie ? { cookie } : {}) } });
}

export async function send(method, path, body, { cookie, ua = DESKTOP_UA } = {}) {
  return fetch(BASE + path, {
    method,
    redirect: "manual",
    headers: { "content-type": "application/json", "user-agent": ua, ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** Deletes everything this check created (orgs cascade). Safe to call twice. */
export async function cleanup() {
  for (const id of created.orgs.splice(0)) await service.from("organizations").delete().eq("id", id);
  for (const id of created.users.splice(0)) await service.auth.admin.deleteUser(id).catch(() => {});
}

export function fail(msg) {
  console.error("FAIL:", msg);
  process.exitCode = 1;
}
