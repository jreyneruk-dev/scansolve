// Creates a pre-seeded demo / sandbox org for the 15-minute pitch call.
// Founder-run, service-role only. Mirrors how the app assigns org_number, UIDs,
// and survey config so the demo behaves like a real, commissioned site.

// Mirror of lib/labels.ts:formatUID — "10" + 2-digit year + 6-digit sequence.
function formatUID(seqNum, year) {
  const yy = String(year ?? new Date().getFullYear()).slice(-2);
  return `10${yy}${String(seqNum).padStart(6, "0")}`;
}

// Facilities/workplace sample assets. Names read like real kit so a screen-share
// looks live; categories match the kind of faults each asset attracts.
const SAMPLE_LOCATIONS = [
  { name: "Reception Desk",            categories: ["Lighting", "Cleaning", "Furniture", "Other"] },
  { name: "Ground-Floor Meeting Room", categories: ["AV / Screen", "Heating / AC", "Furniture", "Cleaning"] },
  { name: "Kitchen Coffee Machine",    categories: ["Not working", "Out of beans", "Leaking", "Needs cleaning"] },
  { name: "Rooftop HVAC Unit",         categories: ["Not cooling", "Noise / vibration", "Leak", "Error code"] },
  { name: "2nd-Floor Toilets",         categories: ["No supplies", "Blocked", "Leak", "Cleaning"] },
];

const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();

// [locationName, category, description, status, createdHoursAgo, resolvedHoursAgo|null]
// Statuses span the workflow; resolved rows carry a realistic created→resolved
// gap so the pilot scorecard (Phase 2b) has resolution-time data to chart.
const SAMPLE_ISSUES = [
  ["Reception Desk",            "Lighting",          "Spotlight above the desk is flickering.",            "resolved",    240, 210],
  ["Kitchen Coffee Machine",    "Out of beans",      "Coffee machine is out of beans again.",              "resolved",    120, 118],
  ["Kitchen Coffee Machine",    "Leaking",           "Water pooling under the coffee machine.",            "in_progress",  30, null],
  ["Ground-Floor Meeting Room", "AV / Screen",       "Meeting room screen won't connect over HDMI.",       "assigned",     26, null],
  ["Rooftop HVAC Unit",         "Noise / vibration", "HVAC unit rattling loudly since this morning.",      "reported",      6, null],
  ["2nd-Floor Toilets",         "No supplies",       "Out of paper towels in the 2nd-floor toilets.",      "resolved",     72, 67],
  ["Reception Desk",            "Cleaning",          "Coffee spill by reception not cleaned up.",          "reported",      3, null],
  ["Rooftop HVAC Unit",         "Error code",        "HVAC panel showing error E4.",                       "assigned",     50, null],
  ["Ground-Floor Meeting Room", "Heating / AC",      "Meeting room is freezing cold.",                     "resolved",     96, 90],
];

async function createDemoOrg({ supabase, appUrl, name }) {
  const orgName = (name && String(name).trim()) || "ScanSolve Demo — Workplace";
  const base = String(appUrl || "https://scansolve.co").replace(/\/$/, "");
  const demoEmail = `demo+${Date.now().toString(36)}@scansolve.co`;

  // 1) Dedicated demo auth user — owns the org so the founder signs in to a
  //    clean, isolated dashboard rather than tangling with a real account.
  const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
    email: demoEmail,
    email_confirm: true,
    user_metadata: { demo: true },
  });
  if (userErr) throw new Error("create demo user: " + userErr.message);
  const ownerId = userData.user.id;
  const rollback = async () => { try { await supabase.auth.admin.deleteUser(ownerId); } catch {} };

  // 2) Organization — comp Prime, never expires (permanent showcase).
  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .insert({ name: orgName, owner_id: ownerId, plan: "prime", plan_source: "comp", plan_expires_at: null, backend: "supabase" })
    .select("id, org_number")
    .single();
  if (orgErr) { await rollback(); throw new Error("create org: " + orgErr.message); }

  // 3) Reserve a UID block via the same atomic RPC the label flow uses.
  const { data: seq, error: seqErr } = await supabase
    .rpc("reserve_label_uids", { p_org_id: org.id, p_count: SAMPLE_LOCATIONS.length });
  if (seqErr) { await rollback(); throw new Error("reserve uids: " + seqErr.message); }
  const seqRow = Array.isArray(seq) ? seq[0] : seq;
  let nextSeq = Number(seqRow.seq_start);

  // 4) Locations — claimed/commissioned so reporters can scan immediately.
  const now = new Date().toISOString();
  const locationsPayload = SAMPLE_LOCATIONS.map((loc) => ({
    org_id: org.id,
    uid: formatUID(nextSeq++),
    name: loc.name,
    claimed_by: ownerId,
    claimed_at: now,
    survey_config: {
      categories: loc.categories,
      fields: {
        description: { enabled: true, required: false },
        photo: { enabled: true, required: false },
        contact: { enabled: true, required: false },
      },
      success_message: "Thanks! The facilities team has been notified.",
    },
  }));
  const { data: locs, error: locErr } = await supabase
    .from("locations").insert(locationsPayload).select("id, uid, name");
  if (locErr) { await rollback(); throw new Error("create locations: " + locErr.message); }

  const idByName = Object.fromEntries(locs.map((l) => [l.name, l.id]));

  // 5) Sample issues across statuses with realistic timing.
  const issuesPayload = SAMPLE_ISSUES.map(([locName, category, description, status, cAgo, rAgo]) => {
    const row = {
      org_id: org.id,
      location_id: idByName[locName],
      category,
      description,
      status,
      created_at: hoursAgo(cAgo),
    };
    if (status === "assigned" || status === "in_progress" || status === "resolved") {
      row.assigned_to = "facilities@demo.scansolve.co";
      row.assigned_at = hoursAgo(cAgo - 1);
    }
    if (status === "resolved" && rAgo != null) row.resolved_at = hoursAgo(rAgo);
    return row;
  });
  const { error: issErr } = await supabase.from("issues").insert(issuesPayload);
  if (issErr) { await rollback(); throw new Error("create issues: " + issErr.message); }

  // 6) Magic link so the founder can sign straight into the demo dashboard.
  let magicLink = null;
  try {
    const { data: link } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: demoEmail,
      options: { redirectTo: `${base}/auth/callback` },
    });
    magicLink = link?.properties?.action_link ?? null;
  } catch { /* link is a convenience; org is already created */ }

  return {
    orgId: org.id,
    orgNumber: org.org_number,
    orgName,
    demoEmail,
    magicLink,
    dashboardUrl: `${base}/dashboard`,
    issueCount: issuesPayload.length,
    locations: locs.map((l) => ({ name: l.name, uid: l.uid, scanUrl: `${base}/scan/${org.org_number}/${l.uid}` })),
  };
}

module.exports = { createDemoOrg };
