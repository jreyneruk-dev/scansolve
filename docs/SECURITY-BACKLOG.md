# Security backlog

Moved into the repo on 2026-07-05 so it survives beyond one laptop (it previously lived
only in a machine-local plan file). This is the standing list of known security work:
live defects to fix, and deliberate hardening that is parked with a trigger. Point-in-time
audit reports live in `.security-audits/`; the weekly white-hat re-audit appends there.
Cross-references `docs/FOUNDATIONS-REVIEW.md` (section 7) and `.planning/audits/`.

## Live defects (open, verified in code)

These are current bugs, not hardening. Ranked by severity. The two mediums should ship
before the first live pilot.

### Push-subscribe SSRF (medium)
`app/api/push/subscribe/route.ts:18` accepts any URL as the push `endpoint` and stores
it. On every new issue, the server POSTs to each stored endpoint via `lib/push.ts`, so a
Prime user can point it at internal addresses (cloud metadata, localhost services). First
flagged in `.security-audits/AUDIT-2026-06-29.md` with a ready host-allowlist fix that was
never applied. Fix: allowlist the known browser push hosts (Apple, FCM, Mozilla, WNS),
https only, before persisting.

### Stripe webhook stomps voucher/comp plans (medium)
`app/api/stripe/webhook/route.ts:99-123` calls `setOrgPlan(orgId, "free", "free")`
unconditionally on subscription-inactive or subscription-deleted events, clearing
`plan_expires_at` and `plan_source`. An org that cancelled Stripe and later got a voucher
or a comp grant is downgraded when the old subscription's final event arrives. Fix: only
downgrade when `plan_source === 'paid'`.

### Reporter IP stored reversibly (low, GDPR)
`app/api/issues/route.ts:141` computes `Buffer.from(ip).toString("base64").slice(0,12)`
and the comment calls it an irreversible hash. Base64 is reversible; most IPv4 addresses
recover fully. Reporter IPs are personal data, and the privacy page states no tracking.
Fix: `createHash("sha256").update(ip + salt).digest("hex").slice(0,12)`.

### Raw database errors returned to clients (low)
`app/api/organizations/route.ts`, `app/api/labels/history/route.ts`, and
`app/api/labels/configured/route.ts` pass Postgres `error.message` straight to the
response. Any authenticated member can read internal error text. Fix: generic message to
the client, real error to the server log. This lands naturally with the pathfinder's API
kit (`.planning/audits/PATHFINDER.md`, step 3).

### Issue-assignment emails to arbitrary addresses (low)
`app/api/issues/[id]/route.ts` lets any member set `assigned_to` to any valid email and
then emails issue details there, with no rate limit on the route. Fix: restrict
`assigned_to` to org-member emails, and rate-limit the route.

### Voucher use_count race (low, confirmed)
`app/api/vouchers/redeem/route.ts:83-95` does three writes in `Promise.all` labelled
"atomically"; they are not a transaction, and the cap check at `:53` races. Two concurrent
redemptions of a near-cap multi-use voucher both pass and both write `n+1` (lost update).
Fix: one SQL function `UPDATE vouchers SET use_count = use_count + 1 WHERE id = $1 AND
use_count < max_uses RETURNING *`. Trigger to prioritise: first multi-use public campaign.

## Parked hardening (not open holes; revisit on trigger)

### Nonce-based CSP
Production CSP is `script-src 'self' 'unsafe-inline'` (`middleware.ts`). The
`'unsafe-inline'` token defeats CSP's script-injection protection. It is there because
Next.js App Router bootstraps hydration with inline scripts. Fix: per-request nonce in
middleware, `script-src 'self' 'nonce-<rand>' 'strict-dynamic'`. Parked because it is a
second line of defence (the real XSS vectors were fixed by escaping), it forces static
marketing pages to render dynamically, and a mistake white-screens production. Trigger:
richer user-generated HTML, a public embed, or an enterprise security review. Effort:
about half a day. Note: the SEO audit found the AdSense loader is already blocked by this
CSP, so any CSP change should decide the AdSense question at the same time.

### Owner-vs-member role enforcement
`org_members.role` (`owner`/`member`, migration 003) is written but never read. Any member
can change the storage backend and credentials, redeem vouchers, rename the org, invite
members, start Stripe checkout, and change branding. Fix: the pathfinder's org-context
spine returns the role; then gate the mutating routes on `role === 'owner'`
(`.planning/audits/PATHFINDER.md`, step 4). Trigger: first pilot with more than about three
seats, or the first "who can change settings?" question. Enterprise asks on day one.

### User-lookup scale cliffs
Email-to-user resolution goes through the auth admin API in three places with two failure
thresholds: `app/api/labels/history/route.ts` (default 50-user page) and
`app/api/auth/send-to-recovery/route.ts` plus `admin-tool/lib/create-pilot.js` (1,000-user
page). Fix: a `profiles` table keyed by lowercased email (pathfinder step 5). Trigger:
approaching 50 total auth users, which the labels-history cliff hits first.

### Preview deployments share the production database
Vercel preview branches run against the production Supabase project with the service-role
key, so a buggy preview can mutate live data. Trigger: the first real customer. Fix: a
second Supabase project for previews, or omit the service-role key from preview env so
preview writes fail loudly.

## Operational

The admin tool is now committed (Day 2). It holds service-role power (tier changes,
comps, org deletion, pilot provisioning) and, until an audit-log seam exists
(pathfinder step 6), those actions leave no trace. Instrument it into the same
`audit_log` table when that lands.

Enterprise procurement will ask for SOC 2 Type II or ISO 27001, SAML SSO, audit logging,
a pen-test report, and a DPA with a data-residency answer. None block pilots; all block
conversions. SOC 2 Type II is a 6–12 month runway, so the start trigger (first pilot
signalling conversion intent) is itself a decision to make, logged in
`docs/GTM-STRATEGY.md`.
