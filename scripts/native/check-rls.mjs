// G8: the anon key can't read native_push_tokens even when rows exist (service role can — positive control).
import { makeUser, makeOrg, service, anon, cleanup, fail } from "./_helpers.mjs";
try {
  const owner = await makeUser("rls");
  const org = await makeOrg(owner, "prime");
  const token = `rls:${Date.now()}:${Math.random().toString(36).slice(2)}aaaaaaaa`;
  const { error } = await service.from("native_push_tokens").insert({ org_id: org.id, user_id: owner.id, token, platform: "android" });
  if (error) throw error;
  const { data: svc } = await service.from("native_push_tokens").select("id").eq("token", token);
  const { data: pub, error: pubErr } = await anon().from("native_push_tokens").select("id").eq("token", token);
  const { error: insErr } = await anon().from("native_push_tokens").insert({ org_id: org.id, token: token + "b", platform: "ios" });
  if (svc?.length !== 1) fail("control: service role could not read the row");
  if ((pub?.length ?? 0) !== 0) fail(`anon read ${pub.length} rows`);
  if (!insErr) fail("anon insert succeeded");
  if (!process.exitCode) console.log("RLS_OK", pubErr ? "(read denied)" : "(read empty)");
} finally {
  await cleanup();
}
