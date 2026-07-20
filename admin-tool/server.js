/**
 * ScanSolve Admin Tool — local use only
 *
 * Usage:
 *   1. Add to your .env.local:
 *        ADMIN_USERNAME=admin
 *        ADMIN_PASSWORD=your-strong-password-here
 *   2. cd admin-tool && npm install && npm start
 *   3. Open http://localhost:3001
 *
 * This server reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * from ../.env.local automatically.
 */

const http    = require("node:http");
const crypto  = require("node:crypto");
const path    = require("node:path");
const fs      = require("node:fs");

// Load env from the parent project's .env.local
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const { createClient } = require("@supabase/supabase-js");
const cookie = require("cookie");
const { createDemoOrg } = require("./lib/demo-org");
const { createPilot } = require("./lib/create-pilot");

// ── Config ───────────────────────────────────────────────────────────────────

const PORT           = parseInt(process.env.ADMIN_PORT ?? "3001", 10);
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.error("ERROR: Set ADMIN_USERNAME and ADMIN_PASSWORD in ../.env.local");
  process.exit(1);
}
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("ERROR: Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in ../.env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// Session secret — random per process start (sessions invalidated on restart)
const SESSION_SECRET = crypto.randomBytes(32).toString("hex");
const SESSION_COOKIE = "admin_session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

// ── Session helpers ──────────────────────────────────────────────────────────

function makeSessionToken() {
  const payload = `${Date.now()}:${ADMIN_USERNAME}`;
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

function isValidSession(token) {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const lastColon = decoded.lastIndexOf(":");
    const payload = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);
    const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return false;
    const ts = parseInt(payload.split(":")[0], 10);
    return Date.now() - ts < SESSION_MAX_AGE * 1000;
  } catch { return false; }
}

function getSession(req) {
  const cookies = cookie.parse(req.headers.cookie ?? "");
  return cookies[SESSION_COOKIE] ? isValidSession(cookies[SESSION_COOKIE]) : false;
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function html(res, status, body) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(body);
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

function body(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try { resolve(JSON.parse(data)); } catch { resolve(Object.fromEntries(new URLSearchParams(data))); }
    });
  });
}

// ── Supabase queries ─────────────────────────────────────────────────────────

async function getStats() {
  const [orgsRes, membersRes, issuesRes, invitesRes, planRows] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase.from("org_members").select("id", { count: "exact", head: true }),
    supabase.from("issues").select("id", { count: "exact", head: true }),
    supabase.from("org_invites").select("id", { count: "exact", head: true }).is("accepted_at", null).gt("expires_at", new Date().toISOString()),
    supabase.from("organizations").select("plan, plan_source, plan_expires_at"),
  ]);

  // Tier breakdown by *effective* plan (expired vouchers count as Starter)
  const tiers = { free: 0, prime: 0, enterprise: 0 };
  const primeSource = { paid: 0, voucher: 0, comp: 0 };
  for (const o of planRows.data ?? []) {
    const eff = effPlan(o);
    tiers[eff] = (tiers[eff] ?? 0) + 1;
    if (eff === "prime") {
      const src = o.plan_source === "paid" ? "paid" : o.plan_source === "voucher" ? "voucher" : "comp";
      primeSource[src] += 1;
    }
  }

  return {
    orgs: orgsRes.count ?? 0,
    members: membersRes.count ?? 0,
    issues: issuesRes.count ?? 0,
    pendingInvites: invitesRes.count ?? 0,
    tiers,
    primeSource,
  };
}

async function getOrgs() {
  // Fetch orgs with member count and recent invite status
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name, plan, plan_source, plan_expires_at, stripe_customer_id, stripe_subscription_id, created_at, owner_id")
    .order("created_at", { ascending: false });

  if (!orgs) return [];

  // For each org, get member count and owner email
  const enriched = await Promise.all(orgs.map(async (org) => {
    const [membersRes, ownerRes, issueCountRes] = await Promise.all([
      supabase.from("org_members").select("id, role, user_id", { count: "exact" }).eq("org_id", org.id),
      org.owner_id ? supabase.auth.admin.getUserById(org.owner_id) : Promise.resolve({ data: { user: null } }),
      supabase.from("issues").select("id", { count: "exact", head: true }).eq("org_id", org.id),
    ]);
    return {
      ...org,
      memberCount: membersRes.count ?? 0,
      ownerEmail: ownerRes.data?.user?.email ?? "—",
      issueCount: issueCountRes.count ?? 0,
    };
  }));

  return enriched;
}

async function getVouchers() {
  const { data, error } = await supabase
    .from("vouchers")
    .select("id, code, tier, duration, max_uses, use_count, notes, created_at, expires_at")
    .order("created_at", { ascending: false });
  if (error) console.error("[admin] getVouchers:", error.message);
  return data ?? [];
}

async function getRecentRedemptions() {
  const { data, error } = await supabase
    .from("voucher_redemptions")
    .select("id, redeemed_at, vouchers(code), organizations(name)")
    .order("redeemed_at", { ascending: false })
    .limit(10);
  if (error) console.error("[admin] getRecentRedemptions:", error.message);
  return data ?? [];
}

async function getBannedEmails() {
  const { data, error } = await supabase
    .from("banned_emails")
    .select("id, email, banned_at")
    .order("banned_at", { ascending: false });
  if (error) console.error("[admin] getBannedEmails:", error.message);
  return data ?? [];
}

async function getRecentActivity() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [newOrgs, newInvites, expiredInvites] = await Promise.all([
    supabase.from("organizations").select("id, name, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(10),
    supabase.from("org_invites").select("id, email, org_id, created_at, organizations(name)").gte("created_at", since).order("created_at", { ascending: false }).limit(10),
    supabase.from("org_invites").select("id, email, org_id, expires_at, organizations(name)").is("accepted_at", null).lt("expires_at", new Date().toISOString()).order("expires_at", { ascending: false }).limit(10),
  ]);

  return {
    newOrgs: newOrgs.data ?? [],
    newInvites: newInvites.data ?? [],
    expiredInvites: expiredInvites.data ?? [],
  };
}

// ── HTML pages ────────────────────────────────────────────────────────────────

function loginPage(error = "") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>ScanSolve Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-slate-100 flex items-center justify-center p-6">
  <div class="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-slate-900">ScanSolve Admin</h1>
      <p class="text-sm text-slate-500 mt-1">Internal portal — local access only</p>
    </div>
    ${error ? `<div class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">${error}</div>` : ""}
    <form method="POST" action="/login" class="space-y-4">
      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1.5">Username</label>
        <input name="username" type="text" autocomplete="username" required
          class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
      </div>
      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
        <input name="password" type="password" autocomplete="current-password" required
          class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
      </div>
      <button type="submit"
        class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors">
        Sign in
      </button>
    </form>
  </div>
</body>
</html>`;
}

function dashboardPage(stats, orgs, activity, bannedEmails, vouchers, redemptions) {
  const orgRows = orgs.map((org) => `
    <tr class="border-b border-slate-100 hover:bg-slate-50 search-row"
        data-org-id="${org.id}"
        data-search="${escHtml((org.name + " " + org.ownerEmail).toLowerCase())}">
      <td class="px-4 py-3">
        <span class="org-name font-medium text-slate-900" data-id="${org.id}">${escHtml(org.name)}</span>
        <input class="org-name-input hidden border border-indigo-300 rounded px-2 py-0.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
               data-id="${org.id}" value="${escHtml(org.name)}"/>
      </td>
      <td class="px-4 py-3">
        <span class="blur-sm select-none cursor-pointer text-slate-600 text-sm transition-all duration-200"
              title="Click to reveal" onclick="this.classList.toggle('blur-sm')">${escHtml(org.ownerEmail)}</span>
      </td>
      <td class="px-4 py-3">${planSelect(org)}</td>
      <td class="px-4 py-3">${sourceCell(org)}</td>
      <td class="px-4 py-3 text-sm text-slate-500 text-center">${org.memberCount}</td>
      <td class="px-4 py-3 text-sm text-slate-500 text-center">${org.issueCount}</td>
      <td class="px-4 py-3 text-sm text-slate-400">${fmtDate(org.created_at)}</td>
      <td class="px-4 py-3">
        <div class="flex items-center gap-1.5 flex-wrap">
          <button type="button"
            class="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 transition-colors edit-btn" data-id="${org.id}">
            Edit name
          </button>
          <button type="button"
            class="text-xs px-2.5 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors hidden save-btn" data-id="${org.id}">
            Save
          </button>
          <button type="button"
            class="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors hidden cancel-btn" data-id="${org.id}">
            Cancel
          </button>
          <button type="button" data-id="${org.id}" data-name="${escHtml(org.name)}"
            class="text-xs px-2.5 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors delete-btn">
            Delete
          </button>
          <button type="button" data-id="${org.id}" data-name="${escHtml(org.name)}"
            class="text-xs px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors font-semibold ban-btn">
            Ban
          </button>
        </div>
      </td>
    </tr>`).join("");

  const newOrgRows = activity.newOrgs.map((o) =>
    `<li class="text-sm"><span class="text-slate-900 font-medium">${escHtml(o.name)}</span> <span class="text-slate-400">created ${fmtDate(o.created_at)}</span></li>`
  ).join("") || `<li class="text-sm text-slate-400">None in the last 7 days</li>`;

  const newInviteRows = activity.newInvites.map((i) => {
    const orgName = i.organizations?.name ?? i.org_id;
    return `<li class="text-sm flex items-center gap-2">
      <span class="blur-sm select-none cursor-pointer text-slate-600" title="Click to reveal" onclick="this.classList.toggle('blur-sm')">${escHtml(i.email)}</span>
      <span class="text-slate-400">→ ${escHtml(orgName)} · ${fmtDate(i.created_at)}</span>
    </li>`;
  }).join("") || `<li class="text-sm text-slate-400">None in the last 7 days</li>`;

  const expiredRows = activity.expiredInvites.map((i) => {
    const orgName = i.organizations?.name ?? i.org_id;
    return `<li class="text-sm flex items-center gap-2">
      <span class="blur-sm select-none cursor-pointer text-amber-700" title="Click to reveal" onclick="this.classList.toggle('blur-sm')">${escHtml(i.email)}</span>
      <span class="text-slate-400">→ ${escHtml(orgName)} · expired ${fmtDate(i.expires_at)}</span>
    </li>`;
  }).join("") || `<li class="text-sm text-slate-400">No expired invites — all good</li>`;

  const DURATION_LABEL = { lifetime: "Lifetime", "1year": "1 year", "1month": "1 month" };
  const voucherRows = (vouchers ?? []).map((v) => {
    const used = v.use_count >= v.max_uses;
    const codeExpired = v.expires_at && new Date(v.expires_at) < new Date();
    const dead = used || codeExpired;
    return `<tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="px-4 py-3">
        <span class="font-mono text-sm font-semibold ${dead ? "text-slate-400 line-through" : "text-slate-900"}">${escHtml(v.code)}</span>
        <button type="button" data-code="${escHtml(v.code)}"
          class="ml-2 text-[11px] text-indigo-500 hover:text-indigo-700 copy-code-btn">copy</button>
        ${codeExpired ? '<span class="ml-2 text-[11px] text-red-500">code expired</span>' : ""}
      </td>
      <td class="px-4 py-3"><span class="text-xs font-semibold px-2 py-0.5 rounded-full ${v.tier === "enterprise" ? "bg-violet-100 text-violet-700" : "bg-indigo-100 text-indigo-700"}">${v.tier === "enterprise" ? "Enterprise" : "Prime"}</span></td>
      <td class="px-4 py-3 text-sm text-slate-600">${DURATION_LABEL[v.duration] ?? escHtml(v.duration)}</td>
      <td class="px-4 py-3 text-sm text-center ${used ? "text-red-600 font-semibold" : "text-slate-500"}">${v.use_count} / ${v.max_uses}</td>
      <td class="px-4 py-3 text-sm text-slate-400">${v.expires_at ? fmtDate(v.expires_at) : "—"}</td>
      <td class="px-4 py-3 text-sm text-slate-500">${escHtml(v.notes ?? "")}</td>
      <td class="px-4 py-3 text-sm text-slate-400">${fmtDate(v.created_at)}</td>
    </tr>`;
  }).join("");

  const redemptionRows = (redemptions ?? []).map((r) =>
    `<li class="text-sm flex items-center gap-2">
      <span class="font-mono text-slate-700">${escHtml(r.vouchers?.code ?? "—")}</span>
      <span class="text-slate-400">→ ${escHtml(r.organizations?.name ?? "—")} · ${fmtDate(r.redeemed_at)}</span>
    </li>`
  ).join("") || `<li class="text-sm text-slate-400">No redemptions yet</li>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>ScanSolve Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-100 min-h-screen">

  <!-- Nav -->
  <nav class="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
    <div class="flex items-center gap-3">
      <span class="text-lg font-bold text-slate-900">ScanSolve Admin</span>
      <span class="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">LOCAL ONLY</span>
    </div>
    <div class="flex items-center gap-4">
      <button onclick="location.reload()" class="text-sm text-slate-500 hover:text-slate-900 transition-colors">↻ Refresh</button>
      <form method="POST" action="/logout" style="display:inline">
        <button type="submit" class="text-sm text-slate-500 hover:text-red-600 transition-colors">Sign out</button>
      </form>
    </div>
  </nav>

  <main class="max-w-7xl mx-auto px-6 py-8 space-y-8">

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      ${[
        { label: "Organisations", value: stats.orgs },
        { label: "Total Members", value: stats.members },
        { label: "Total Issues", value: stats.issues },
        { label: "Pending Invites", value: stats.pendingInvites, warn: stats.pendingInvites > 0 },
      ].map((s) => `
        <div class="bg-white rounded-xl shadow-sm p-4 border ${s.warn ? "border-amber-200 bg-amber-50" : "border-slate-100"}">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">${s.label}</p>
          <p class="text-3xl font-bold mt-1 ${s.warn ? "text-amber-700" : "text-slate-900"}">${s.value}</p>
        </div>`).join("")}
    </div>

    <!-- Tier breakdown -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
      <div class="flex flex-wrap items-center gap-x-8 gap-y-3">
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Tiers</p>
          <div class="flex items-center gap-4 mt-1.5">
            <span class="text-sm"><span class="font-bold text-slate-900 text-lg">${stats.tiers.free}</span> <span class="text-slate-500">Starter</span></span>
            <span class="text-sm"><span class="font-bold text-indigo-700 text-lg">${stats.tiers.prime}</span> <span class="text-slate-500">Prime</span></span>
            <span class="text-sm"><span class="font-bold text-violet-700 text-lg">${stats.tiers.enterprise}</span> <span class="text-slate-500">Enterprise</span></span>
          </div>
        </div>
        <div class="border-l border-slate-100 pl-8">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Prime by source</p>
          <div class="flex items-center gap-3 mt-1.5">
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Paid ${stats.primeSource.paid}</span>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Voucher ${stats.primeSource.voucher}</span>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">Comp ${stats.primeSource.comp}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Org table -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
        <h2 class="font-semibold text-slate-900 shrink-0">Organisations</h2>
        <div class="flex items-center gap-3 flex-1 justify-end">
          <input id="search" type="search" placeholder="Search name or email…"
            oninput="filterOrgs(this.value)"
            class="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          <span id="search-count" class="text-xs text-slate-400 shrink-0 hidden"></span>
          <span class="text-xs text-slate-400 shrink-0">Emails blurred — click to reveal</span>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Owner email</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Source</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Members</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Issues</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Created</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${orgRows || '<tr><td colspan="8" class="px-4 py-8 text-center text-slate-400 text-sm">No organisations yet</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <!-- New pilot -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-slate-900">New pilot</h2>
        <span class="text-xs text-slate-400">comp Prime · expires</span>
      </div>
      <p class="text-sm text-slate-500">Stand up a real prospect pilot: champion-owned org, time-limited Prime, their locations pre-commissioned, and a magic link to hand over. No sample data.</p>
      <form onsubmit="createPilot(event)" class="space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Organisation name</label>
            <input id="p-name" type="text" placeholder="Acme Leisure — Riverside"
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Champion email <span class="text-slate-400 font-normal">(owner)</span></label>
            <input id="p-email" type="email" placeholder="facilities@acme.com"
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1">Locations <span class="text-slate-400 font-normal">(one per line)</span></label>
          <textarea id="p-locations" rows="4" placeholder="Reception Desk&#10;Ground-Floor Toilets&#10;Coffee Machine — Kitchen"
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Categories <span class="text-slate-400 font-normal">(comma-sep, optional)</span></label>
            <input id="p-categories" type="text" placeholder="Broken, Cleaning, Supplies, Safety"
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Expires (days)</label>
              <input id="p-expiry" type="number" min="1" value="30"
                class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">App URL</label>
              <input id="p-appurl" type="text" value="https://scansolve.co"
                class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            </div>
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1">Logo URL <span class="text-slate-400 font-normal">(optional)</span></label>
          <input id="p-logo" type="text" placeholder="https://..."
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
        </div>
        <button type="submit"
          class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors">
          Create pilot
        </button>
      </form>
      <div id="pilot-result" class="hidden text-sm bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2"></div>
    </div>

    <!-- Demo / sandbox org -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-slate-900">Demo / sandbox org</h2>
        <span class="text-xs text-slate-400">pre-seeded · comp Prime</span>
      </div>
      <p class="text-sm text-slate-500">Creates a ready-to-show org with sample workplace locations and issues, plus a magic link to sign in. Use it for the 15-minute pitch call.</p>
      <form onsubmit="createDemoOrg(event)" class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1">Org name</label>
          <input id="d-name" type="text" value="ScanSolve Demo — Workplace"
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1">App URL <span class="text-slate-400 font-normal">(for links)</span></label>
          <input id="d-appurl" type="text" value="https://scansolve.co"
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
        </div>
        <div>
          <button type="submit"
            class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors">
            Create demo org
          </button>
        </div>
      </form>
      <div id="demo-result" class="hidden text-sm bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2"></div>
    </div>

    <!-- Vouchers -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 class="font-semibold text-slate-900">Vouchers</h2>
          <span class="text-xs text-slate-400">${(vouchers ?? []).length} total</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Code</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Tier</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Duration</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Uses</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Code expires</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Created</th>
              </tr>
            </thead>
            <tbody>
              ${voucherRows || '<tr><td colspan="7" class="px-4 py-8 text-center text-slate-400 text-sm">No vouchers yet — generate one →</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
        <h3 class="font-semibold text-slate-900 text-sm">Generate voucher</h3>
        <form onsubmit="generateVoucher(event)" class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Code <span class="text-slate-400 font-normal">(blank = random)</span></label>
            <input id="v-code" type="text" placeholder="GYMCHAIN2026"
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Tier</label>
              <select id="v-tier" class="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="prime">Prime</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Duration</label>
              <select id="v-duration" class="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="lifetime">Lifetime</option>
                <option value="1year">1 year</option>
                <option value="1month">1 month</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Max uses</label>
            <input id="v-maxuses" type="number" min="1" value="1"
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Notes <span class="text-slate-400 font-normal">(who/why)</span></label>
            <input id="v-notes" type="text" placeholder="Comp for Anytime Fitness pilot"
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
          </div>
          <button type="submit"
            class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors">
            Generate
          </button>
        </form>
        <div class="border-t border-slate-100 pt-3">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Recent redemptions</p>
          <ul class="space-y-1.5">${redemptionRows}</ul>
        </div>
      </div>
    </div>

    <!-- Activity -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

      <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-3">
        <h3 class="font-semibold text-slate-900 text-sm">New Organisations <span class="text-slate-400 font-normal">(7d)</span></h3>
        <ul class="space-y-2">${newOrgRows}</ul>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-3">
        <h3 class="font-semibold text-slate-900 text-sm">Recent Invites <span class="text-slate-400 font-normal">(7d)</span></h3>
        <ul class="space-y-2">${newInviteRows}</ul>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-amber-100 p-5 space-y-3">
        <h3 class="font-semibold text-amber-800 text-sm">⚠ Expired Invites</h3>
        <ul class="space-y-2">${expiredRows}</ul>
      </div>

    </div>

    <!-- Banned Emails -->
    <div class="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
      <div class="px-6 py-4 border-b border-red-100 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <h2 class="font-semibold text-slate-900">Banned Emails</h2>
          <span class="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">${bannedEmails.length} banned</span>
        </div>
        <form id="ban-email-form" class="flex items-center gap-2" onsubmit="banEmailDirect(event)">
          <input id="ban-email-input" type="email" placeholder="email@example.com" required
            class="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-red-400"/>
          <button type="submit"
            class="text-xs px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors">
            Ban email
          </button>
        </form>
      </div>
      ${bannedEmails.length === 0
        ? `<p class="px-6 py-8 text-center text-slate-400 text-sm">No banned emails</p>`
        : `<div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-red-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Banned</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                ${bannedEmails.map((b) => `
                  <tr class="border-b border-slate-100 hover:bg-slate-50" id="ban-row-${b.id}">
                    <td class="px-4 py-3">
                      <span class="blur-sm select-none cursor-pointer text-slate-700 text-sm font-mono transition-all duration-200"
                            title="Click to reveal" onclick="this.classList.toggle('blur-sm')">${escHtml(b.email)}</span>
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-400">${fmtDate(b.banned_at)}</td>
                    <td class="px-4 py-3">
                      <button type="button" data-id="${b.id}" data-email="${escHtml(b.email)}"
                        class="text-xs px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 font-semibold transition-colors unban-btn">
                        Unban
                      </button>
                    </td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>`}
    </div>

  </main>

  <!-- Toast -->
  <div id="toast" class="fixed bottom-6 right-6 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg opacity-0 transition-opacity duration-300 pointer-events-none"></div>

  <script>
    // Delegated click handling. Buttons carry their data in data-* attributes and
    // are wired up here, so no untrusted value (org name, email, voucher code) is
    // ever interpolated into JS source. dataset values arrive as plain strings and
    // are never parsed as code — this is what closes the stored-XSS hole that inline
    // onclick="fn('<name>')" handlers had (issue #34).
    document.addEventListener("click", (e) => {
      const el = e.target.closest("[data-id],[data-code]");
      if (!el) return;
      const { id, name, email, code } = el.dataset;
      if (el.classList.contains("edit-btn")) return startEditName(id);
      if (el.classList.contains("save-btn")) return saveEditName(id);
      if (el.classList.contains("cancel-btn")) return cancelEditName(id);
      if (el.classList.contains("delete-btn")) return deleteOrg(id, name);
      if (el.classList.contains("ban-btn")) return banOrg(id, name);
      if (el.classList.contains("unban-btn")) return unbanEmail(id, email);
      if (el.classList.contains("copy-code-btn")) {
        navigator.clipboard.writeText(code);
        toast("Copied " + code);
      }
    });

    document.addEventListener("change", (e) => {
      const sel = e.target.closest(".plan-select");
      if (sel) updatePlan(sel.dataset.id, sel.value);
    });

    function toast(msg, isErr = false) {
      const t = document.getElementById("toast");
      t.textContent = msg;
      t.className = "fixed bottom-6 right-6 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg transition-opacity duration-300 " + (isErr ? "bg-red-700" : "bg-slate-900");
      t.style.opacity = 1;
      setTimeout(() => t.style.opacity = 0, 2800);
    }

    function startEditName(id) {
      document.querySelector('.org-name[data-id="'+id+'"]').classList.add("hidden");
      document.querySelector('.org-name-input[data-id="'+id+'"]').classList.remove("hidden");
      document.querySelector('.edit-btn[data-id="'+id+'"]').classList.add("hidden");
      document.querySelector('.save-btn[data-id="'+id+'"]').classList.remove("hidden");
      document.querySelector('.cancel-btn[data-id="'+id+'"]').classList.remove("hidden");
      document.querySelector('.org-name-input[data-id="'+id+'"]').focus();
    }

    function cancelEditName(id) {
      const input = document.querySelector('.org-name-input[data-id="'+id+'"]');
      input.value = document.querySelector('.org-name[data-id="'+id+'"]').textContent;
      input.classList.add("hidden");
      document.querySelector('.org-name[data-id="'+id+'"]').classList.remove("hidden");
      document.querySelector('.edit-btn[data-id="'+id+'"]').classList.remove("hidden");
      document.querySelector('.save-btn[data-id="'+id+'"]').classList.add("hidden");
      document.querySelector('.cancel-btn[data-id="'+id+'"]').classList.add("hidden");
    }

    async function saveEditName(id) {
      const input = document.querySelector('.org-name-input[data-id="'+id+'"]');
      const newName = input.value.trim();
      if (!newName) return;
      const res = await fetch("/api/orgs/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        document.querySelector('.org-name[data-id="'+id+'"]').textContent = newName;
        cancelEditName(id);
        toast("Name updated");
      } else {
        const d = await res.json();
        toast(d.error || "Failed to update", true);
      }
    }

    async function updatePlan(id, plan) {
      const res = await fetch("/api/orgs/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (res.ok) { toast("Plan updated to " + plan); }
      else {
        const d = await res.json();
        toast(d.error || "Failed to update plan", true);
        location.reload();
      }
    }

    async function deleteOrg(id, name) {
      if (!confirm("Delete organisation \\"" + name + "\\" and ALL its data?\\n\\nThis cannot be undone.")) return;
      const res = await fetch("/api/orgs/" + id, { method: "DELETE" });
      if (res.ok) {
        const row = document.querySelector('tr[data-org-id="'+id+'"]');
        if (row) row.remove();
        toast("Organisation deleted");
      } else {
        const d = await res.json();
        toast(d.error || "Failed to delete", true);
      }
    }

    async function banOrg(id, name) {
      if (!confirm(
        "BAN \\"" + name + "\\"?\\n\\n" +
        "This will:\\n" +
        "• Delete the organisation and all its data\\n" +
        "• Permanently ban the owner\\'s email address\\n" +
        "• Prevent them from ever creating a new account\\n\\n" +
        "This cannot be undone."
      )) return;
      const res = await fetch("/api/orgs/" + id + "/ban", { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        const row = document.querySelector('tr[data-org-id="'+id+'"]');
        if (row) row.remove();
        toast("Banned" + (d.bannedEmail ? ": " + d.bannedEmail : ""));
      } else {
        const d = await res.json();
        toast(d.error || "Failed to ban", true);
      }
    }

    async function unbanEmail(id, email) {
      if (!confirm('Unban "' + email + '"?\\n\\nThey will be able to sign up and use ScanSolve again.')) return;
      const res = await fetch("/api/banned/" + encodeURIComponent(id), { method: "DELETE" });
      if (res.ok) {
        const row = document.getElementById("ban-row-" + id);
        if (row) row.remove();
        toast("Unbanned: " + email);
      } else {
        const d = await res.json();
        toast(d.error || "Failed to unban", true);
      }
    }

    async function banEmailDirect(e) {
      e.preventDefault();
      const email = document.getElementById("ban-email-input").value.trim();
      if (!email) return;
      const res = await fetch("/api/banned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast("Banned: " + email);
        document.getElementById("ban-email-input").value = "";
        setTimeout(() => location.reload(), 800);
      } else {
        const d = await res.json();
        toast(d.error || "Failed to ban", true);
      }
    }

    function filterOrgs(query) {
      const q = query.trim().toLowerCase();
      const rows = document.querySelectorAll(".search-row");
      let shown = 0;
      rows.forEach(row => {
        const haystack = row.dataset.search || "";
        const match = !q || haystack.includes(q);
        row.style.display = match ? "" : "none";
        if (match) shown++;
      });
      const countEl = document.getElementById("search-count");
      if (q) {
        countEl.textContent = shown + " of " + rows.length + " shown";
        countEl.classList.remove("hidden");
      } else {
        countEl.classList.add("hidden");
      }
    }

    async function createPilot(e) {
      e.preventDefault();
      const btn = e.submitter;
      if (btn) { btn.disabled = true; btn.textContent = "Creating…"; }
      const payload = {
        name: document.getElementById("p-name").value.trim(),
        email: document.getElementById("p-email").value.trim(),
        locations: document.getElementById("p-locations").value,
        categories: document.getElementById("p-categories").value.trim(),
        expiry_days: parseInt(document.getElementById("p-expiry").value, 10) || 30,
        app_url: document.getElementById("p-appurl").value.trim(),
        logo_url: document.getElementById("p-logo").value.trim(),
      };
      try {
        const res = await fetch("/api/pilot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const d = await res.json();
        if (!res.ok) { toast(d.error || "Failed to create pilot", true); return; }
        const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
        const scans = (d.locations || []).map((l) =>
          '<li><span class="font-medium text-slate-700">' + esc(l.name) + '</span> <span class="text-slate-400 font-mono">' + esc(l.uid) + '</span></li>'
        ).join("");
        const box = document.getElementById("pilot-result");
        box.innerHTML =
          '<div class="font-semibold text-slate-900">' + esc(d.orgName) + ' · org #' + esc(d.orgNumber) + '</div>' +
          '<div class="text-slate-500">Champion: ' + esc(d.championEmail) + ' · expires ' + new Date(d.expiresAt).toLocaleDateString("en-GB") + '</div>' +
          (d.magicLink ? '<div><a class="text-indigo-600 font-medium break-all" target="_blank" href="' + esc(d.magicLink) + '">Champion sign-in link ↗</a></div>' : '') +
          '<div class="flex gap-3 text-xs">' +
            '<a class="text-indigo-600" target="_blank" href="' + esc(d.labelsUrl) + '">Print labels ↗</a>' +
            '<a class="text-indigo-600" target="_blank" href="' + esc(d.insightsUrl) + '">Insights ↗</a>' +
          '</div>' +
          '<div class="text-slate-500">' + (d.locations || []).length + ' locations commissioned:</div>' +
          '<ul class="list-disc pl-5 space-y-0.5">' + scans + '</ul>';
        box.classList.remove("hidden");
        toast("Pilot created — org #" + d.orgNumber);
      } catch (err) {
        toast("Failed to create pilot", true);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = "Create pilot"; }
      }
    }

    async function createDemoOrg(e) {
      e.preventDefault();
      const btn = e.submitter;
      if (btn) { btn.disabled = true; btn.textContent = "Creating…"; }
      const payload = {
        name: document.getElementById("d-name").value.trim(),
        app_url: document.getElementById("d-appurl").value.trim(),
      };
      try {
        const res = await fetch("/api/demo-org", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const d = await res.json();
        if (!res.ok) { toast(d.error || "Failed to create demo org", true); return; }
        const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
        const scans = (d.locations || []).map((l) =>
          '<li><span class="font-medium text-slate-700">' + esc(l.name) + '</span> — <a class="text-indigo-600 break-all" target="_blank" href="' + esc(l.scanUrl) + '">' + esc(l.scanUrl) + '</a></li>'
        ).join("");
        const box = document.getElementById("demo-result");
        box.innerHTML =
          '<div class="font-semibold text-slate-900">' + esc(d.orgName) + ' · org #' + esc(d.orgNumber) + '</div>' +
          (d.magicLink ? '<div><a class="text-indigo-600 font-medium break-all" target="_blank" href="' + esc(d.magicLink) + '">Sign in to the demo dashboard ↗</a></div>' : '') +
          '<div class="text-slate-500">' + esc(d.issueCount) + ' sample issues · ' + (d.locations || []).length + ' locations</div>' +
          '<ul class="list-disc pl-5 space-y-1">' + scans + '</ul>';
        box.classList.remove("hidden");
        toast("Demo org created — org #" + d.orgNumber);
      } catch (err) {
        toast("Failed to create demo org", true);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = "Create demo org"; }
      }
    }

    async function generateVoucher(e) {
      e.preventDefault();
      const payload = {
        code: document.getElementById("v-code").value.trim().toUpperCase(),
        tier: document.getElementById("v-tier").value,
        duration: document.getElementById("v-duration").value,
        max_uses: parseInt(document.getElementById("v-maxuses").value, 10) || 1,
        notes: document.getElementById("v-notes").value.trim(),
      };
      const res = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (res.ok) {
        await navigator.clipboard.writeText(d.code).catch(() => {});
        toast("Created " + d.code + " — copied to clipboard");
        setTimeout(() => location.reload(), 900);
      } else {
        toast(d.error || "Failed to generate voucher", true);
      }
    }
  </script>
</body>
</html>`;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function escHtml(str) {
  // Escapes for HTML text and quoted attribute values ONLY — a single context.
  //
  // It is NOT sufficient for values interpolated into JS source (e.g. an inline
  // onclick="fn('...')"), because the browser HTML-decodes an attribute before the
  // JS parser sees it: an escaped &#x27; round-trips to a literal ' and breaks out
  // of the JS string. That was issue #34. Never build JS by interpolation — pass
  // untrusted values via data-* attributes and read them from dataset instead.
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/`/g, "&#96;");
}

// Mirror of lib/plans.ts getEffectivePlan — an expired voucher drops to Starter.
function effPlan(o) {
  const plan = o.plan;
  if (plan === "free") return "free";
  if (plan === "enterprise") return "enterprise";
  if (plan === "prime") {
    if (o.plan_expires_at && new Date(o.plan_expires_at) < new Date()) return "free";
    return "prime";
  }
  return "free"; // unknown/legacy value
}

const PLAN_BADGE = {
  free:       { label: "Starter",    cls: "bg-slate-100 text-slate-600" },
  prime:      { label: "Prime",      cls: "bg-indigo-100 text-indigo-700" },
  enterprise: { label: "Enterprise", cls: "bg-violet-100 text-violet-700" },
};

const SOURCE_BADGE = {
  paid:    { label: "Paid",    cls: "bg-emerald-100 text-emerald-700" },
  voucher: { label: "Voucher", cls: "bg-amber-100 text-amber-700" },
  comp:    { label: "Comp",    cls: "bg-sky-100 text-sky-700" },
  free:    { label: "—",       cls: "bg-slate-100 text-slate-400" },
};

// Source/status cell for an org: badge + voucher expiry + Stripe link.
function sourceCell(org) {
  const eff = effPlan(org);
  if (eff === "free") {
    // Show if a once-paid org has lapsed (expired voucher / cancelled sub)
    const lapsed = org.plan === "prime" || org.plan_source === "paid" || org.plan_source === "voucher";
    return lapsed
      ? `<span class="text-xs text-slate-400">lapsed</span>`
      : `<span class="text-xs text-slate-300">—</span>`;
  }
  const src = SOURCE_BADGE[org.plan_source] ?? SOURCE_BADGE.comp;
  const expiry = org.plan_expires_at
    ? `<div class="text-[11px] text-slate-400 mt-0.5">until ${fmtDate(org.plan_expires_at)}</div>`
    : "";
  const stripe = org.stripe_customer_id
    ? `<a href="https://dashboard.stripe.com/customers/${escHtml(org.stripe_customer_id)}" target="_blank" rel="noopener"
         class="text-[11px] text-indigo-500 hover:text-indigo-700 mt-0.5 inline-block">Stripe ↗</a>`
    : "";
  return `<span class="text-xs font-semibold px-2 py-0.5 rounded-full ${src.cls}">${src.label}</span>${expiry}${stripe}`;
}

function planSelect(org) {
  const eff = effPlan(org);
  // Reflect the *effective* plan in the dropdown so an expired voucher reads "Starter".
  const opt = (v, lbl) => `<option value="${v}" ${eff === v ? "selected" : ""}>${lbl}</option>`;
  return `<select class="border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 bg-white focus:outline-none plan-select"
            data-id="${org.id}">
    ${opt("free", "Starter")}${opt("prime", "Prime")}${opt("enterprise", "Enterprise")}
  </select>`;
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function parseOrgId(url) {
  const m = url.match(/^\/api\/orgs\/([a-f0-9-]{36})(\/.*)?$/);
  return m ? m[1] : null;
}

function isBanUrl(url) {
  return /^\/api\/orgs\/[a-f0-9-]{36}\/ban$/.test(url);
}

function parseBannedId(url) {
  const m = url.match(/^\/api\/banned\/([a-f0-9-]{36})$/);
  return m ? m[1] : null;
}

// ── Request router ────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url    = req.url ?? "/";
  const method = req.method ?? "GET";

  // Login page
  if (url === "/login" && method === "GET") {
    return html(res, 200, loginPage());
  }

  // Login handler
  if (url === "/login" && method === "POST") {
    const data = await body(req);
    // Hash both sides to a fixed length so timingSafeEqual never throws on a
    // length mismatch (which would otherwise crash the server) while staying
    // constant-time.
    const sha = (s) => crypto.createHash("sha256").update(String(s)).digest();
    const userOk = crypto.timingSafeEqual(sha(data.username ?? ""), sha(ADMIN_USERNAME));
    const passOk = crypto.timingSafeEqual(sha(data.password ?? ""), sha(ADMIN_PASSWORD));
    if (userOk && passOk) {
      const token = makeSessionToken();
      res.writeHead(302, {
        Location: "/",
        "Set-Cookie": cookie.serialize(SESSION_COOKIE, token, {
          httpOnly: true, sameSite: "strict", maxAge: SESSION_MAX_AGE, path: "/",
        }),
      });
      return res.end();
    }
    return html(res, 401, loginPage("Incorrect username or password."));
  }

  // Logout
  if (url === "/logout" && method === "POST") {
    res.writeHead(302, {
      Location: "/login",
      "Set-Cookie": cookie.serialize(SESSION_COOKIE, "", { httpOnly: true, maxAge: 0, path: "/" }),
    });
    return res.end();
  }

  // Auth gate — everything below requires a valid session
  if (!getSession(req)) {
    if (url.startsWith("/api/")) return json(res, 401, { error: "Unauthorized" });
    return redirect(res, "/login");
  }

  // ── Dashboard ──
  if (url === "/" && method === "GET") {
    try {
      const [stats, orgs, activity, bannedEmails, vouchers, redemptions] = await Promise.all([
        getStats(), getOrgs(), getRecentActivity(), getBannedEmails(), getVouchers(), getRecentRedemptions(),
      ]);
      return html(res, 200, dashboardPage(stats, orgs, activity, bannedEmails, vouchers, redemptions));
    } catch (err) {
      return html(res, 500, `<pre>Error: ${err.message}</pre>`);
    }
  }

  // ── API: list orgs ──
  if (url === "/api/orgs" && method === "GET") {
    try {
      const orgs = await getOrgs();
      return json(res, 200, orgs);
    } catch (err) {
      return json(res, 500, { error: err.message });
    }
  }

  // ── API: update org ──
  const orgId = parseOrgId(url);
  if (orgId && method === "PATCH") {
    const data = await body(req);
    const updates = {};
    if (typeof data.name === "string" && data.name.trim()) updates.name = data.name.trim();

    if (typeof data.plan === "string" && ["free", "prime", "enterprise"].includes(data.plan)) {
      if (data.plan === "free") {
        // Manual downgrade. NOTE: if this org pays via Stripe, also cancel the
        // subscription in Stripe — this only flips the local plan flag.
        updates.plan = "free";
        updates.plan_source = "free";
        updates.plan_expires_at = null;
      } else {
        // Granting Prime/Enterprise. Preserve a genuine Stripe 'paid' source so
        // we don't lose the billing linkage; otherwise mark it as a comp grant.
        const { data: cur } = await supabase
          .from("organizations").select("plan_source").eq("id", orgId).single();
        updates.plan = data.plan;
        if (cur?.plan_source === "paid") {
          updates.plan_source = "paid";
        } else {
          updates.plan_source = "comp";
          updates.plan_expires_at = null; // comp grants never expire
        }
      }
    }

    if (Object.keys(updates).length === 0) return json(res, 400, { error: "Nothing to update" });

    const { error } = await supabase.from("organizations").update(updates).eq("id", orgId);
    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { ok: true, ...updates });
  }

  // ── API: delete org ──
  if (orgId && method === "DELETE" && !isBanUrl(url)) {
    const { data: org } = await supabase.from("organizations").select("owner_id").eq("id", orgId).single();
    const { error } = await supabase.from("organizations").delete().eq("id", orgId);
    if (error) return json(res, 500, { error: error.message });

    // Delete auth account if the owner has no other orgs
    if (org?.owner_id) {
      const { count } = await supabase.from("organizations").select("id", { count: "exact", head: true }).eq("owner_id", org.owner_id);
      if ((count ?? 1) === 0) {
        await supabase.auth.admin.deleteUser(org.owner_id);
      }
    }
    return json(res, 200, { ok: true });
  }

  // ── API: ban org owner & delete everything ──
  if (isBanUrl(url) && method === "POST") {
    const id = parseOrgId(url);
    if (!id) return json(res, 400, { error: "Invalid org id" });

    // 1. Fetch org + owner details before deleting
    const { data: org } = await supabase.from("organizations").select("owner_id, name").eq("id", id).single();
    if (!org) return json(res, 404, { error: "Org not found" });

    let ownerEmail = null;
    if (org.owner_id) {
      const { data: userData } = await supabase.auth.admin.getUserById(org.owner_id);
      ownerEmail = userData?.user?.email ?? null;
    }

    // 2. Delete org (cascades all related data)
    const { error: delErr } = await supabase.from("organizations").delete().eq("id", id);
    if (delErr) return json(res, 500, { error: delErr.message });

    // 3. Ban the email so it can never be used again
    if (ownerEmail) {
      await supabase.from("banned_emails").upsert(
        { email: ownerEmail.toLowerCase() },
        { onConflict: "email" }
      );
    }

    // 4. Delete the Supabase Auth account (they can't log in regardless, but belt-and-braces)
    if (org.owner_id) {
      await supabase.auth.admin.deleteUser(org.owner_id);
    }

    return json(res, 200, { ok: true, bannedEmail: ownerEmail });
  }

  // ── API: unban email by ID ──
  const bannedId = parseBannedId(url);
  if (bannedId && method === "DELETE") {
    const { error } = await supabase.from("banned_emails").delete().eq("id", bannedId);
    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { ok: true });
  }

  // ── API: ban email directly (without deleting an org) ──
  if (url === "/api/banned" && method === "POST") {
    const data = await body(req);
    const email = (typeof data.email === "string" ? data.email : "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(res, 400, { error: "Invalid email" });
    }
    const { error } = await supabase
      .from("banned_emails")
      .upsert({ email }, { onConflict: "email" });
    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { ok: true });
  }

  // ── API: generate voucher ──
  if (url === "/api/vouchers" && method === "POST") {
    const data = await body(req);

    const tier = data.tier === "enterprise" ? "enterprise" : "prime";
    const duration = ["lifetime", "1year", "1month"].includes(data.duration) ? data.duration : null;
    if (!duration) return json(res, 400, { error: "Invalid duration" });

    let maxUses = parseInt(data.max_uses, 10);
    if (!Number.isFinite(maxUses) || maxUses < 1) maxUses = 1;

    let code = (typeof data.code === "string" ? data.code : "").trim().toUpperCase().replace(/\s+/g, "");
    if (!code) code = "SS" + crypto.randomBytes(4).toString("hex").toUpperCase();
    if (!/^[A-Z0-9-]{3,32}$/.test(code)) {
      return json(res, 400, { error: "Code must be 3–32 chars: A–Z, 0–9, hyphen" });
    }

    const notes = typeof data.notes === "string" && data.notes.trim() ? data.notes.trim() : null;

    const { error } = await supabase.from("vouchers").insert({
      code, tier, duration, max_uses: maxUses, notes, created_by: ADMIN_USERNAME,
    });
    if (error) {
      if (error.code === "23505") return json(res, 409, { error: "That code already exists" });
      return json(res, 500, { error: error.message });
    }
    return json(res, 200, { ok: true, code });
  }

  // ── API: stand up a prospect pilot (comp Prime, champion-owned) ──
  if (url === "/api/pilot" && method === "POST") {
    const data = await body(req);
    const locationNames = typeof data.locations === "string"
      ? data.locations.split(/\r?\n/)
      : Array.isArray(data.locations) ? data.locations : [];
    const categories = typeof data.categories === "string" ? data.categories.split(",") : [];
    const expiryDays = parseInt(data.expiry_days, 10);
    const appUrl = (typeof data.app_url === "string" && data.app_url.trim())
      ? data.app_url.trim()
      : (process.env.NEXT_PUBLIC_APP_URL || "https://scansolve.co");
    try {
      const result = await createPilot({
        supabase, appUrl,
        orgName: data.name,
        championEmail: data.email,
        locationNames, categories,
        logoUrl: data.logo_url,
        expiryDays,
      });
      return json(res, 200, { ok: true, ...result });
    } catch (e) {
      return json(res, 400, { error: e.message || "Failed to create pilot" });
    }
  }

  // ── API: create a pre-seeded demo / sandbox org ──
  if (url === "/api/demo-org" && method === "POST") {
    const data = await body(req);
    const name = typeof data.name === "string" && data.name.trim() ? data.name.trim() : null;
    const appUrl = (typeof data.app_url === "string" && data.app_url.trim())
      ? data.app_url.trim()
      : (process.env.NEXT_PUBLIC_APP_URL || "https://scansolve.co");
    try {
      const result = await createDemoOrg({ supabase, appUrl, name });
      return json(res, 200, { ok: true, ...result });
    } catch (e) {
      return json(res, 500, { error: e.message || "Failed to create demo org" });
    }
  }

  // 404
  if (url.startsWith("/api/")) return json(res, 404, { error: "Not found" });
  return html(res, 404, "<h1>Not found</h1>");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n  ScanSolve Admin Portal`);
  console.log(`  ─────────────────────────────────────`);
  console.log(`  Local: http://localhost:${PORT}`);
  console.log(`  Username: ${ADMIN_USERNAME}`);
  console.log(`  Press Ctrl+C to stop\n`);
});
