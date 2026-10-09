// G7: native device tokens are stored for Prime orgs, refused for free orgs, and removed on unregister.
import { randomBytes } from "node:crypto";
import { makeUser, makeOrg, sessionCookie, send, service, cleanup, fail, NATIVE_UA } from "./_helpers.mjs";

try {
  const primeOwner = await makeUser("pushp");
  const primeOrg = await makeOrg(primeOwner, "prime");
  const freeOwner = await makeUser("pushf");
  await makeOrg(freeOwner, "free");
  const token = `fake:${randomBytes(24).toString("hex")}`;
  const [pc, fc] = await Promise.all([sessionCookie(primeOwner.email), sessionCookie(freeOwner.email)]);

  const ok = await send("POST", "/api/push/subscribe", { kind: "native", token, platform: "ios" }, { cookie: pc, ua: NATIVE_UA });
  if (ok.status !== 200) fail(`prime subscribe → ${ok.status} ${await ok.text()}`);
  const { data: row } = await service.from("native_push_tokens").select("org_id, platform").eq("token", token).maybeSingle();
  if (row?.org_id !== primeOrg.id || row?.platform !== "ios") fail(`token row wrong: ${JSON.stringify(row)}`);

  const free = await send("POST", "/api/push/subscribe", { kind: "native", token: token + "x", platform: "android" }, { cookie: fc, ua: NATIVE_UA });
  if (free.status !== 403) fail(`free subscribe → ${free.status}`);

  const anonRes = await send("POST", "/api/push/subscribe", { kind: "native", token: token + "y", platform: "ios" }, { ua: NATIVE_UA });
  if (anonRes.status !== 401) fail(`anonymous subscribe → ${anonRes.status}`);

  // Another org can't remove this org's device.
  await send("POST", "/api/push/unsubscribe", { token }, { cookie: fc, ua: NATIVE_UA });
  const { count: still } = await service.from("native_push_tokens").select("id", { count: "exact", head: true }).eq("token", token);
  if (still !== 1) fail("another org removed the token");

  const off = await send("POST", "/api/push/unsubscribe", { token }, { cookie: pc, ua: NATIVE_UA });
  const { count } = await service.from("native_push_tokens").select("id", { count: "exact", head: true }).eq("token", token);
  if (off.status !== 200 || count !== 0) fail(`unsubscribe → ${off.status}, rows left ${count}`);
  if (!process.exitCode) console.log("NATIVE_PUSH_OK");
} finally {
  await cleanup();
}
