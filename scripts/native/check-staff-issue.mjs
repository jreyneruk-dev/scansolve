// G8b: staff log an issue with a free-text location; org comes from the session only.
import { makeUser, makeOrg, sessionCookie, send, get, service, cleanup, fail } from "./_helpers.mjs";
try {
  const owner = await makeUser("staff");
  const org = await makeOrg(owner, "free");
  const other = await makeOrg(await makeUser("other"), "free");
  const cookie = await sessionCookie(owner.email);
  const where = `Block C stairwell ${Date.now()}`;

  const res = await send("POST", "/api/issues/staff", { location_text: where, category: "Lighting", description: "Bulb out", org_id: other.id }, { cookie });
  const body = await res.json().catch(() => ({}));
  if (res.status !== 201 || !body.id) fail(`create → ${res.status} ${JSON.stringify(body)}`);
  else {
    const { data: issue } = await service.from("issues").select("org_id, location_id, location_text, created_by").eq("id", body.id).single();
    if (issue.org_id !== org.id) fail("issue landed in the org named in the body, not the session org");
    if (issue.location_id !== null || issue.location_text !== where || issue.created_by !== owner.id) fail(`issue row: ${JSON.stringify(issue)}`);
    const html = await (await get("/dashboard", { cookie })).text();
    if (!html.includes(where) || !html.includes("No label")) fail("dashboard list doesn't show the free-text location with a No label tag");
    const detail = await (await get(`/dashboard/issues/${body.id}`, { cookie })).text();
    if (!detail.includes(where)) fail("issue detail doesn't show the location text");
  }

  const unauth = await send("POST", "/api/issues/staff", { location_text: where, category: "Lighting" });
  if (unauth.status !== 401) fail(`unauthenticated → ${unauth.status}`);
  const blank = await send("POST", "/api/issues/staff", { location_text: "   ", category: "Lighting" }, { cookie });
  if (blank.status !== 422) fail(`blank location → ${blank.status}`);

  const { error: dbErr } = await service.from("issues").insert({ org_id: org.id, category: "x", status: "reported" });
  if (!dbErr) fail("DB accepted an issue with no location at all");
  if (!process.exitCode) console.log("STAFF_ISSUE_OK");
} finally {
  await cleanup();
}
