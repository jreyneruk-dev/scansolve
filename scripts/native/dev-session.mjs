// Local UI checking: `node dev-session.mjs` creates a throwaway Prime org + user and prints
// its session cookies as JSON; `node dev-session.mjs --cleanup <userId> <orgId>` removes them.
import { makeUser, makeOrg, sessionCookie, service } from "./_helpers.mjs";
if (process.argv[2] === "--cleanup") {
  await service.from("organizations").delete().eq("id", process.argv[4]);
  await service.auth.admin.deleteUser(process.argv[3]);
  console.log("CLEANED");
} else {
  const u = await makeUser("ui");
  const o = await makeOrg(u, "prime", "UI Check Facilities");
  await service.from("issues").insert({ org_id: o.id, location_text: "Side gate by the bike racks", category: "Broken equipment", status: "reported", created_by: u.id });
  const cookie = await sessionCookie(u.email);
  console.log(JSON.stringify({ user: u.id, org: o.id, cookies: cookie.split("; ").map((c) => { const i = c.indexOf("="); return [c.slice(0, i), c.slice(i + 1)]; }) }));
}
