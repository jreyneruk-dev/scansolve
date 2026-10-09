// G5: account deletion. Member leaves; owner takes the org, its rows and storage with them;
// a failed subscription cancel deletes nothing.
import "./_alias.mjs";
import { makeUser, makeOrg, sessionCookie, send, service, cleanup, fail } from "./_helpers.mjs";

const BUCKET = "issue-photos";
const exists = async (id) => !!(await service.auth.admin.getUserById(id)).data?.user;
const rows = async (table, orgId) => (await service.from(table).select("*", { count: "exact", head: true }).eq("org_id", orgId)).count ?? 0;

try {
  // 1. Stripe failure aborts before anything is deleted (library level, with a key Stripe rejects).
  {
    const owner = await makeUser("abort");
    const org = await makeOrg(owner, "prime");
    const saved = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = "sk_test_deliberately_invalid";
    const { deleteAccount, DeletionAborted } = await import("../../lib/account-deletion.ts");
    let aborted = false;
    try { await deleteAccount(owner.id, { ...org, stripe_subscription_id: "sub_check_abort" }); }
    catch (e) { aborted = e instanceof DeletionAborted; }
    process.env.STRIPE_SECRET_KEY = saved;
    const orgLeft = (await service.from("organizations").select("id").eq("id", org.id)).data?.length === 1;
    if (!aborted || !orgLeft || !(await exists(owner.id))) fail(`stripe abort: aborted=${aborted} orgLeft=${orgLeft}`);
    else console.log("stripe_abort=pass");
  }

  // 2. Through the API: a member, then the owner.
  const owner = await makeUser("owner");
  const member = await makeUser("member");
  const org = await makeOrg(owner, "prime");
  await service.from("org_members").insert({ org_id: org.id, user_id: member.id, role: "member" });
  const { data: loc } = await service.from("locations").insert({ org_id: org.id, uid: `9${Date.now()}`, name: "Check room", claimed_by: member.id }).select().single();
  await service.from("issues").insert({ org_id: org.id, location_id: loc.id, category: "Leak", status: "reported" });
  await service.from("issues").insert({ org_id: org.id, location_text: "Car park", category: "Light", status: "reported", created_by: member.id });
  await service.from("native_push_tokens").insert({ org_id: org.id, user_id: owner.id, token: `del:${Date.now()}aaaaaaaaaaaaaaaa`, platform: "ios" });
  const png = Buffer.from("89504e470d0a1a0a", "hex");
  for (const p of [`${org.id}/a.png`, `${org.id}/issue-x/b.png`, `logos/${org.id}/logo.png`, `floorplans/${org.id}/f.png`]) {
    const { error } = await service.storage.from(BUCKET).upload(p, png, { contentType: "image/png", upsert: true });
    if (error) throw error;
  }

  const [oc, mc] = await Promise.all([sessionCookie(owner.email), sessionCookie(member.email)]);

  const wrong = await send("DELETE", "/api/account", { confirm: "not the name" }, { cookie: mc });
  if (wrong.status !== 422) fail(`wrong confirmation → ${wrong.status}`);

  const m = await send("DELETE", "/api/account", { confirm: org.name }, { cookie: mc });
  if (m.status !== 200) fail(`member delete → ${m.status} ${await m.text()}`);
  if (await exists(member.id)) fail("member user still exists");
  if ((await rows("issues", org.id)) !== 2) fail("member deletion removed org issues");

  const o = await send("DELETE", "/api/account", { confirm: org.name.toUpperCase() }, { cookie: oc });
  if (o.status !== 200) fail(`owner delete → ${o.status} ${await o.text()}`);
  if (await exists(owner.id)) fail("owner user still exists");
  const left = (await Promise.all(["issues", "locations", "org_members", "native_push_tokens"].map((t) => rows(t, org.id)))).reduce((a, b) => a + b, 0)
    + ((await service.from("organizations").select("id").eq("id", org.id)).data?.length ?? 0);
  let objects = 0;
  for (const prefix of [org.id, `${org.id}/issue-x`, `logos/${org.id}`, `floorplans/${org.id}`]) {
    objects += ((await service.storage.from(BUCKET).list(prefix)).data ?? []).length;
  }
  if (left || objects) fail(`left behind: rows=${left} objects=${objects}`);
  if (!process.exitCode) console.log(`DELETE_OK rows=${left} objects=${objects} stripe_abort=pass`);
} finally {
  await cleanup();
}
