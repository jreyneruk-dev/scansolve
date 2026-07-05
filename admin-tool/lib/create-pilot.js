// Stands up a real prospect pilot in one pass (founder-run, service-role).
// Like demo-org.js but for a live pilot: the prospect's champion owns the org,
// comp Prime expires in N days, locations are the prospect's real assets, and
// there is no sample data. Mirrors the app's UID assignment so labels are real.

function formatUID(seqNum, year) {
  const yy = String(year ?? new Date().getFullYear()).slice(-2);
  return `10${yy}${String(seqNum).padStart(6, "0")}`;
}

const DEFAULT_CATEGORIES = ["Broken / not working", "Cleaning", "Supplies", "Safety", "Other"];

// Reuse an existing auth user if the champion already has an account, else make one.
// ponytail: scans the first 1000 users to find an existing match; swap to a lookup
// table if the user base ever outgrows that.
async function getOrCreateUser(supabase, email) {
  const { data, error } = await supabase.auth.admin.createUser({ email, email_confirm: true });
  if (!error && data?.user) return data.user.id;
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const u = list?.users?.find((x) => x.email?.toLowerCase() === email.toLowerCase());
  if (u) return u.id;
  throw new Error("create/find champion user: " + (error?.message || "unknown"));
}

async function createPilot({ supabase, appUrl, orgName, championEmail, locationNames, categories, logoUrl, expiryDays }) {
  const base = String(appUrl || "https://scansolve.co").replace(/\/$/, "");
  const name = String(orgName || "").trim();
  const email = String(championEmail || "").trim().toLowerCase();
  const names = (locationNames || []).map((s) => String(s).trim()).filter(Boolean);

  if (!name) throw new Error("Organisation name is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("A valid champion email is required.");
  if (!names.length) throw new Error("Add at least one location (one per line).");
  if (names.length > 200) throw new Error("Max 200 locations per pilot.");

  const days = Number.isFinite(expiryDays) && expiryDays > 0 ? expiryDays : 30;
  const expiresAt = new Date(Date.now() + days * 86_400_000).toISOString();

  const ownerId = await getOrCreateUser(supabase, email);

  // Org — comp Prime, expires after the trial window.
  const orgRow = { name, owner_id: ownerId, plan: "prime", plan_source: "comp", plan_expires_at: expiresAt, backend: "supabase" };
  if (logoUrl && String(logoUrl).trim()) orgRow.logo_url = String(logoUrl).trim();
  const { data: org, error: orgErr } = await supabase
    .from("organizations").insert(orgRow).select("id, org_number").single();
  if (orgErr) throw new Error("create org: " + orgErr.message);

  // From here on, delete the org on failure so a partial pilot does not linger.
  // (Leave the champion user alone — they may have pre-existed.)
  const abort = async (msg) => { await supabase.from("organizations").delete().eq("id", org.id); throw new Error(msg); };

  const { data: seq, error: seqErr } = await supabase
    .rpc("reserve_label_uids", { p_org_id: org.id, p_count: names.length });
  if (seqErr) return abort("reserve uids: " + seqErr.message);
  const seqRow = Array.isArray(seq) ? seq[0] : seq;
  let next = Number(seqRow.seq_start);

  const cats = (categories || []).map((s) => String(s).trim()).filter(Boolean);
  const surveyCats = cats.length ? cats : DEFAULT_CATEGORIES;
  const now = new Date().toISOString();
  const locsPayload = names.map((locName) => ({
    org_id: org.id,
    uid: formatUID(next++),
    name: locName,
    claimed_by: ownerId,
    claimed_at: now,
    survey_config: {
      categories: surveyCats,
      fields: {
        description: { enabled: true, required: false },
        photo: { enabled: true, required: false },
        contact: { enabled: true, required: false },
      },
      success_message: "Thanks! The facilities team has been notified.",
    },
  }));
  const { data: locs, error: locErr } = await supabase
    .from("locations").insert(locsPayload).select("uid, name");
  if (locErr) return abort("create locations: " + locErr.message);

  let magicLink = null;
  try {
    const { data: link } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${base}/auth/callback` },
    });
    magicLink = link?.properties?.action_link ?? null;
  } catch { /* link is a convenience; the pilot org already exists */ }

  return {
    orgId: org.id,
    orgNumber: org.org_number,
    orgName: name,
    championEmail: email,
    expiresAt,
    magicLink,
    dashboardUrl: `${base}/dashboard`,
    labelsUrl: `${base}/dashboard/labels`,
    insightsUrl: `${base}/dashboard/insights`,
    locations: locs.map((l) => ({ name: l.name, uid: l.uid, scanUrl: `${base}/scan/${org.org_number}/${l.uid}` })),
  };
}

module.exports = { createPilot };
