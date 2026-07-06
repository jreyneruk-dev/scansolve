# ScanSolve roadmap

Tracked checklist of decisions and work coming out of the foundations review
(`docs/FOUNDATIONS-REVIEW.md`) and the Day 1 audits (`.planning/audits/`). Status is
kept current as items ship. Detail for each lives in the doc named beside it.

## Decisions

- [x] Pricing: no per-seat tax — confirmed 2026-07-06 (`GTM-STRATEGY.md`).
- [x] Compliance-runway trigger — confirmed 2026-07-06 (`GTM-STRATEGY.md`).
- [x] Own-data backends (Sheets/Airtable): defer and cut — done, adapters removed.
- [x] AdSense: remove fully — done.
- [x] Preview shares prod DB: accept now, fix at first customer.
- [x] Owner/member role enforcement: agreed, land in the architecture track before the
  first multi-seat pilot.
- [ ] Supabase: founder upgrading off free tier (2026-07-07). Confirm daily backups +
  point-in-time recovery are on after the upgrade.
- [x] Analytics: chose Vercel Web Analytics (cookieless, zero-ops, already on the
  platform) over Plausible. Code shipped; privacy page updated. Founder action: enable
  Web Analytics in the Vercel dashboard (Project → Analytics → Enable) — it collects
  nothing until then.
- [ ] Error tracking: decide whether to add Sentry before the first live pilot.
- [ ] Data-residency: pin down and document which region the Supabase project runs in
  (needed for the DPA).
- [ ] When to start the architecture track (below) vs. keep shipping features.

## Shipped this cycle

- [x] Foundations review + Day 1 audits (codebase map, pathfinder, SEO, over-engineering).
- [x] Admin tool committed to git; security backlog moved into `docs/SECURITY-BACKLOG.md`.
- [x] Fixed: push-subscribe SSRF; Stripe webhook stomping voucher/comp plans.
- [x] Cleanup: removed AdSense, the Sheets/Airtable adapters, and dead deps (googleapis,
  uuid, @anthropic-ai/sdk, pg, three Radix packages). Net -1537 lines.

## Security (`docs/SECURITY-BACKLOG.md`)

- [ ] Reversible `reporter_meta.ip_hash` → real SHA-256 (low, GDPR). Small.
- [ ] Stop returning raw DB `error.message` to clients (low). Lands with the API kit.
- [ ] Issue-assignment: restrict `assigned_to` to org members + rate-limit (low).
- [ ] Voucher `use_count` race → single SQL RPC (low). Trigger: first multi-use campaign.
- [ ] Nonce-based CSP (parked). Trigger: user-generated HTML, public embed, or security review.
- [ ] Profiles table to end the `listUsers` 50/1000-user cliffs. Trigger: ~50 auth users.

## Architecture track (`.planning/audits/PATHFINDER.md`)

Enterprise-readiness, ~5–6 days of independent PRs. Steps 1–3 change no behaviour.

- [ ] 1. Type the org object (kills ~55 casts).
- [ ] 2. One service client (kills 25 copies of `getServiceClient`).
- [ ] 3. API kit: client IP, JSON parse, error shape, rate-limit wrapper.
- [ ] 4. Org+role context resolved once; enforce owner-only on billing/backend/invites.
- [ ] 5. Profiles table (also closes the security item above).
- [ ] 6. Audit-log seam (a procurement requirement; instrument the admin tool too).
- [ ] 7. Billing riders: voucher-race RPC (Stripe stomp already fixed).
- [ ] 8. Active-org groundwork for multi-org.

## Marketing / SEO (`.planning/audits/SEO.md`)

- [x] Add `/pricing` to the sitemap.
- [x] Fix double-brand titles on `/pricing`, `/about`, `/privacy`.
- [x] Fix broken Open Graph on `/pricing` (inherited homepage) and `/about` (no image).
- [x] `noindex` the `/scan/*` and `/commission/*` routes.
- [x] Refresh `public/llms.txt` (retire "founding members"; add category/pricing language).
- [~] Category vocabulary — done in pricing/about metadata and llms.txt; still to expand
  into the homepage body copy.
- [ ] Per-vertical landing pages matching the GTM personas (gyms first, then tech/
  workplace, manufacturing, financial services). Large content build.
- [ ] Comparison pages: "ScanSolve vs MaintainX", "vs UpKeep". Large content build;
  double as outreach collateral.
- [ ] Off-site (founder action): list on Capterra and G2 — they own page one for
  "best X software" and unlock the SoftwareApplication rich-result path.

## Outreach (`GTM-STRATEGY.md`)

- [x] Pricing wedge added to the brand-voice and outreach skills.
- [x] Add the facilities-management personas, per-vertical hooks, and LinkedIn title
  strings to `scansolve-outreach` and `scansolve-brand-voice`.
- [ ] Score the LinkedIn connections export against the personas (pending the export).

## Pilot tooling (`docs/PILOT-TOOLING-PLAN.md`)

- [x] Provisioning console + demo-org action built (in the admin tool).
- [ ] Founder action: create the demo org (one click in the admin tool) for demo calls.

## Ops / practice

- [ ] Add a test runner + first tests on the money/security paths (highest-leverage
  engineering item; lands with architecture step 7).
- [ ] Restore drill / manual export (moot once the paid Supabase plan enables backups).
- [ ] Accessibility pass (Lighthouse) on the reporter page and posters.
- [ ] GDPR/DPA review (legal); pen test + SOC 2 scoping (trigger-gated).
