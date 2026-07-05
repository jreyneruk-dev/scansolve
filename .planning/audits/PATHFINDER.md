# Pathfinder: architecture unification audit

**Date:** 2026-07-05
**Scope:** ScanSolve (`qr-issue-tracker/`), Next.js 15 App Router + Supabase.
**Goal:** Find the shared shape underneath the features so Enterprise work (SAML SSO, audit logging, multi-org membership, advanced analytics, own-data backends) slots in instead of piling on.
**Method:** Read `.planning/codebase/ARCHITECTURE.md`, `STRUCTURE.md`, `CONCERNS.md`, then verified every claim below against the code. Counts come from direct grep/read, not from the earlier docs.

This is an evolution plan, not a rewrite. The layering is already right (app → lib → SDKs, no circular imports). What's missing is a small set of shared spines: request context, typed org, one service-client choke point, and a user-profile lookup. Everything Enterprise-shaped hangs off those four.

---

## 1. Feature map

| Feature | Pages / UI | API routes | Shared logic |
|---|---|---|---|
| Reporter flow (public) | `app/scan/[org_number]/[uid]/page.tsx` (+ `success/`, `error.tsx`), `components/survey/SurveyForm.tsx`, `components/ui/ReporterAd.tsx` | `app/api/issues/route.ts` (POST), `app/api/scan/[org_number]/[uid]/route.ts`, `app/api/upload/route.ts` (path B) | `lib/locations.ts`, `lib/sanitize.ts`, `lib/db/*` (adapter), `lib/plans.ts` (ad gating) |
| Manager dashboard (issues) | `app/dashboard/page.tsx`, `app/dashboard/issues/[id]/page.tsx`, `components/dashboard/IssueList.tsx`, `IssueDetail.tsx` | `app/api/issues/[id]/route.ts` (GET/PATCH) | `lib/db/index.ts:getAdapter`, `lib/email.ts` (assignment/status mails), `lib/storage.ts` |
| Insights / analytics | `app/dashboard/insights/page.tsx`, `components/dashboard/InsightsExport.tsx` | — (computed in the page) | adapter reads, `lib/plans.ts` (Prime gate) |
| Labels / QR / commissioning | `app/dashboard/labels/page.tsx`, `components/labels/*`, `components/posters/*`, `app/commission/[org_number]/[uid]/page.tsx`, `components/dashboard/CommissionForm.tsx` | `app/api/labels/reserve/route.ts`, `app/api/labels/history/route.ts`, `app/api/labels/configured/route.ts`, `app/api/locations/route.ts` | `lib/labels.ts` (`SHEET_TYPES`, `formatUID`), `lib/locations.ts`, `reserve_label_uids` RPC (migration 004) |
| Billing / plans | `app/dashboard/billing/page.tsx`, `components/dashboard/BillingClient.tsx`, `app/pricing/`, `components/pricing/*` | `app/api/stripe/checkout/route.ts`, `app/api/stripe/webhook/route.ts` | `lib/plans.ts` (the one genuinely unified concern in the app) |
| Vouchers | redeemed from billing UI | `app/api/vouchers/redeem/route.ts` | `vouchers` + `voucher_redemptions` tables (migration 008); created only via `admin-tool/` |
| Auth / recovery / team | `app/auth/page.tsx`, `app/auth/callback/route.ts`, `app/invite/[token]/page.tsx`, `app/onboarding/page.tsx`, `components/dashboard/TeamSettings.tsx`, `RecoveryEmailSettings.tsx`, `components/invite/AcceptInviteForm.tsx` | `app/api/auth/magic-link/route.ts`, `app/api/auth/check-email/route.ts`, `app/api/auth/send-to-recovery/route.ts`, `app/api/invites/route.ts`, `app/api/invites/[token]/route.ts`, `app/api/onboarding/route.ts` | `middleware.ts` (gate + headers), `lib/auth.ts`, `lib/email.ts`, `banned_emails` (migration 007) |
| Org settings / branding / backends | `app/dashboard/settings/page.tsx`, `components/dashboard/{OrgNameSettings,BackendSettings,BrandingSettings,NotificationSettings}.tsx` | `app/api/organizations/route.ts` (GET/PATCH), `app/api/org/logo/route.ts` (POST/DELETE) | `lib/crypto.ts` (credential encryption), `lib/db/index.ts` |
| Notifications / push | `components/ServiceWorkerRegister.tsx`, `public/sw.js` | `app/api/push/subscribe/route.ts`, `app/api/push/unsubscribe/route.ts`, plus `notifyOrgOfNewIssue` inlined in `app/api/issues/route.ts:17-61` | `lib/push.ts`, `push_subscriptions` (migration 012) |
| Support / AI assist | `components/support/SupportWidget.tsx` | `app/api/support/chat/route.ts` (880 lines), `app/api/support/email/route.ts`, `app/api/ai/suggest/route.ts` | Gemini via `lib/server-env.ts`, `lib/rate-limit.ts` |
| Admin tooling | — (local server on 127.0.0.1:3001) | `admin-tool/server.js` (1,269 lines), `admin-tool/lib/create-pilot.js`, `admin-tool/lib/demo-org.js` | Direct service-role Supabase; untracked by git |
| Marketing | `app/page.tsx`, `app/about/`, `app/privacy/`, `components/features/animation/*` | — | — |

Observation: every authenticated feature starts with the same three moves (get user, resolve org, cast org fields), and every public feature starts with the same two (extract IP, rate limit). Those two prologues are the app's real shared architecture, and neither is a function today.

## 2. Duplicated and overlapping concerns

### 2.1 Service-role client: 25 copies of the same factory

`function getServiceClient()` is defined verbatim in 25 files, and 26 files touch `SUPABASE_SERVICE_ROLE_KEY` (the 26th builds the client inline at `app/api/issues/route.ts:19-23`). Examples: `lib/auth.ts:5`, `lib/db/index.ts:8`, `lib/locations.ts:22`, `app/api/upload/route.ts:20`, `app/api/organizations/route.ts:8`, `app/dashboard/page.tsx:11`, `app/dashboard/settings/page.tsx:13`, `app/onboarding/page.tsx`, `app/auth/callback/route.ts`.

`ARCHITECTURE.md` records this as "intentionally not a shared singleton", but the copies are identical and the duplication has a real cost: there is no single point where RLS-bypassing access can be instrumented, logged, or wrapped. Audit logging (section 4) wants exactly that choke point.

### 2.2 Org resolution: 28 call sites, resolved twice per dashboard render

`lib/auth.ts:getOrgForUser()` is called from 28 sites across 23 files — every dashboard page, `app/dashboard/layout.tsx:6`, and 15 API route files. Each call is 1–2 service-role queries. Because the layout and the page each call it independently, every dashboard render resolves the org twice (e.g. `app/dashboard/layout.tsx:6` + `app/dashboard/page.tsx:34`). Routes with multiple handlers call it once per handler (`app/api/organizations/route.ts:40,58`, `app/api/org/logo/route.ts:34,97`, `app/api/invites/route.ts:37,132`, `app/api/issues/[id]/route.ts:30,100`, `app/api/locations/route.ts:38,82`).

The public path has its own duplicate flavour: `lib/locations.ts:getLocationByOrgAndUID()` (:47-52) queries `organizations` for the id, and the scan page separately calls `getOrgPlanByNumber()` (:12-20) — three org-table round trips per scan render.

### 2.3 The untyped org object and its casts

`getOrgForUser()` returns `Record<string, unknown>` (`lib/auth.ts:47`) or an untyped row. Consequences, verified:

- 29 `as Record<string, unknown>` casts in `app/` + `components/` (most of them on the org object), e.g. `app/api/labels/reserve/route.ts:58-59`, `app/api/vouchers/redeem/route.ts:34`, `app/api/upload/route.ts:100`, `app/api/locations/route.ts:52-53`, `app/dashboard/layout.tsx:7`.
- 13 `org as unknown as Organization` casts, all feeding `lib/plans.ts` functions: `app/dashboard/page.tsx:106`, `app/dashboard/insights/page.tsx:46`, `app/dashboard/settings/page.tsx:69,76`, `app/dashboard/labels/page.tsx:16`, `app/dashboard/billing/page.tsx:17-18`, `app/api/org/logo/route.ts:37`, `app/api/push/subscribe/route.ts:33`, `app/api/invites/route.ts:56`, `app/api/issues/route.ts:31`, `app/api/stripe/checkout/route.ts:25`.
- The `Organization` type itself (`types/schema.ts:5-15`) is stale: it lacks `org_number` (migration 004), `logo_url` (009), `stripe_customer_id`/`stripe_subscription_id` (010). `app/dashboard/billing/page.tsx:18` patches around this with an inline intersection type. Every cast site is hand-asserting columns the compiler can't see.

### 2.4 User-email lookups: three `listUsers` cliffs plus an N+1

There is no profiles table, so email↔user resolution goes through the auth admin API four different ways:

- `app/api/auth/send-to-recovery/route.ts:52` — `listUsers({ page: 1, perPage: 1000 })`, then a linear scan for the email. Silently broken past 1,000 users. The recovery email itself lives in `user_metadata.recovery_email` (:73), invisible to SQL.
- `app/api/labels/history/route.ts:45` — `listUsers()` with no params (default 50), used to map print-job `user_id` → email; falls back to raw UUIDs past 50 users (:62).
- `admin-tool/lib/create-pilot.js:19` — `listUsers({ perPage: 1000 })` to dedupe pilot users.
- `app/api/labels/configured/route.ts:48-53` — a different pattern for the same need: one `auth.admin.getUserById()` call per claiming user, in a `Promise.all` fan-out.

Four implementations, three failure thresholds, one missing table.

### 2.5 Auth prologue: three shapes for one check

- Pages: `requireAuth()` (`lib/auth.ts:20`) — redirects.
- 12 API route files: inline `createSupabaseServerClient()` + `auth.getUser()` + 401 (e.g. `app/api/invites/route.ts:24-26`, `app/api/labels/reserve/route.ts:23-27`, `app/api/onboarding/route.ts:20-22`).
- 4 API route files: `getOptionalUser()` + 401 (`app/api/push/subscribe/route.ts:26-27`, `app/api/push/unsubscribe/route.ts`, `app/api/vouchers/redeem/route.ts:16-17`, `app/api/stripe/checkout/route.ts:14-17`).

The second and third are the same semantic with different code. This matters more than style: `middleware.ts:44-47` deliberately fails open, so per-route auth is the actual security boundary — and there is no single helper to grep for when asserting "every non-public route checks auth".

### 2.6 Rate limiting: one good primitive, ad-hoc application

`lib/rate-limit.ts:checkRateLimit()` is the right primitive, called from 16 sites. But:

- Key formats are improvised per route: `issues:ip:${ip}`, `support-email:${ip}` (no scope segment), `voucher_redeem:${user.id}` (no scope segment), `check-email:ip:${ip}`. No canonical `{feature}:{scope}:{id}` convention.
- IP extraction (`req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? ...`) is copy-pasted in 7+ routes with two different fallback strings ("unknown" in `app/api/upload/route.ts:30`, "anonymous" in `app/api/issues/route.ts:92`).
- 429 responses differ in body and in whether `Retry-After` is set.
- Mutating routes with no limit at all: `app/api/issues/[id]/route.ts` (PATCH sends email to an arbitrary address — flagged in `CONCERNS.md`), `app/api/locations/route.ts`, `app/api/organizations/route.ts` (backend credential changes), `app/api/onboarding/route.ts`, `app/api/invites/[token]/route.ts`, `app/api/stripe/checkout/route.ts`, `app/api/push/unsubscribe/route.ts`.

### 2.7 Error handling: three response dialects

- Public routes: generic strings, correct by design (`app/api/issues/route.ts:111,129`).
- Authenticated routes: `parsed.error.flatten()` (`app/api/labels/reserve/route.ts:50`, `app/api/invites/route.ts:49`, `app/api/locations/route.ts:47`).
- Raw database `error.message` passed straight to the client: `app/api/organizations/route.ts:79,105`, `app/api/labels/history/route.ts:37`, `app/api/labels/configured/route.ts:39`. Any member can read Postgres error text this way.

The `let body: unknown; try { body = await req.json(); } catch { ...400 }` block is duplicated in ~14 routes. `types/schema.ts:108-111` defines an `ApiError` shape (`{ error, code? }`); only some routes use `code`.

### 2.8 Dual upload auth paths

`app/api/upload/route.ts:82-125` implements two authorization paths in one handler: path A (manager: session org must match supplied `org_id`, :86-104) and path B (reporter: `org_number` + `uid` resolved to a server-authoritative org, :106-119). The logic is currently correct, but it is a second, parallel implementation of both org resolution and the reporter lookup, in the one route where a mistake means cross-org storage writes. Zero tests cover it.

### 2.9 Plan gating: unified core, frayed edges

`lib/plans.ts` is the pattern the rest of the app should copy — one table, three functions, a header comment banning direct `org.plan` checks. The fraying: all 13 call sites need the `as unknown as Organization` cast (2.3), and `notifyOrgOfNewIssue` re-fetches the org from the database for its plan check (`app/api/issues/route.ts:25-31`) even though the route just resolved the location. The push fan-out is also `await`ed at `:161`, so reporters wait on it despite the "never blocks" comment.

## 3. Strain points under Enterprise weight

**Single-org assumption.** `lib/auth.ts:41-47` picks an arbitrary membership row via `.limit(1).single()`. A user in two orgs gets routed to whichever row the database returns first — silently, on all 28 call sites at once. Multi-org membership is a named Enterprise target; today the function's shape (userId → one org, no ordering, no selector) can't express it.

**Roles exist but are decoration.** `supabase/migrations/003_org_members_invites.sql:6` defines `role IN ('owner','member')`; `app/api/onboarding/route.ts:58-62` writes `role: "owner"`; nothing anywhere reads it. Any member can change the storage backend and credentials (`app/api/organizations/route.ts:53-107`), redeem vouchers, start Stripe checkout, invite members, and change branding. First multi-seat Enterprise customer asks "who can do what" on day one, and the honest answer is "everyone, everything".

**No audit trail, and nowhere to put one.** Enterprise procurement asks for an audit log; SOC 2 runway needs one. With 26 files creating their own service-role clients and mutating directly, there is no seam where "user X did action Y to resource Z" can be recorded without touching every route individually. The admin tool (`admin-tool/server.js`) makes it worse: plan changes, comps, and deletions happen with no trace and no git history (the directory is untracked).

**Email/user lookups hit cliffs at 50 and 1,000 users.** Section 2.4. A single Enterprise org can carry more than 50 members. Recovery data in `user_metadata` also can't be joined, indexed, or audited.

**The untyped org is where Enterprise columns will land.** SSO config, audit settings, data residency flags, seat counts — all new `organizations` columns. Today each one arrives as another `(org as Record<string, unknown>).sso_config` hand-cast, invisible to the compiler (section 2.3). `PlanLimits` (`lib/plans.ts:20-31`) is boolean flags; seats and retention windows will need numbers, but the table structure extends fine — the casts are the problem, not the design.

**Billing state machine has two known correctness holes.** `app/api/stripe/webhook/route.ts:99-123` downgrades unconditionally without checking `plan_source`, so a lingering Stripe lifecycle event stomps a voucher or comp grant. `app/api/vouchers/redeem/route.ts:83-95` does three writes in `Promise.all` labelled "atomically" — they are not, and the cap check at :53 races. Both are documented in `CONCERNS.md`; both are the kind of thing an Enterprise pilot with a comped plan trips over.

**Auth is hand-rolled around magic links; SSO has no mounting point.** `app/api/auth/magic-link/route.ts` sends links via Resend and `middleware.ts` fails open by design. SAML/OIDC will arrive either through Supabase SSO or a separate IdP flow; either way it needs a single org-context resolution point to attach "this org requires SSO" policy to. That point doesn't exist yet (section 2.2).

**Zero tests under all of it.** No test runner exists (`package.json` has no test script; CI is lint + build). Every refactor in section 5 touches auth, upload authorization, or billing — the three areas `CONCERNS.md` ranks highest risk. The first step of the sequence is cheap precisely so it can land before behavior-changing steps.

## 4. Proposed unified shape

Four spines, all additive. Existing call sites migrate incrementally; nothing needs a flag day.

### 4.1 Typed org context, resolved once

New `lib/org-context.ts`:

```ts
interface OrgContext {
  user: User;
  org: Organization;          // the real, complete type
  role: "owner" | "member";
}

// Server Components: wrapped in React cache() so layout + page share one resolution
getOrgContext(): Promise<OrgContext>            // redirects like requireAuth
// API routes:
requireOrgContext(): Promise<OrgContext | NextResponse>  // 401/403 responses
requireRole(ctx, "owner"): void | NextResponse
```

Internally it does what `lib/auth.ts:getOrgForUser` does today, plus selects `org_members.role`, plus deterministic ordering (`.order("created_at")`) so multi-org users get a stable answer. `types/schema.ts:Organization` gains the missing columns (`org_number`, `logo_url`, `plan_source`, `stripe_customer_id`, `stripe_subscription_id`). This kills both cast families (2.3), the double resolution per dashboard render (2.2), and gives role enforcement and future SSO policy a single home. Multi-org later means one change: `getOrgContext(activeOrgId?)` validated against membership, instead of 28 scattered edits.

### 4.2 One service client, one write seam

New `lib/supabase/service.ts` exporting the existing 6-line factory once. All 25 copies import it. That alone is hygiene; the payoff is the seam: when audit logging lands, mutating helpers (`auditedUpdate(ctx, table, ...)`) or plain explicit `audit()` calls have one import path, and "who bypasses RLS" is answerable by grep.

### 4.3 A profiles table to end the listUsers era

Migration 013: `profiles (user_id uuid pk references auth.users, email text unique not null /* lowercased */, recovery_email text, created_at)`, backfilled from `auth.users`, kept current by the onboarding/invite-accept paths (or a Supabase auth trigger). Replaces all four lookup patterns in 2.4 with indexed queries, moves `recovery_email` out of `user_metadata`, and gives labels history/configured a join instead of admin-API calls.

### 4.4 An audit-log seam

Migration 014: `audit_log (id, org_id, actor_user_id, action text, target_type text, target_id text, meta jsonb, created_at)` + `lib/audit.ts:audit(ctx, action, target, meta)` — fire-and-forget, never throws. Instrument the mutating routes that matter first: backend/credential changes, plan changes (webhook, voucher, admin tool), member/invite changes, issue status changes. Ten call sites cover the procurement conversation. The admin tool writes to the same table with `actor_user_id = null, meta.source = 'admin-tool'`.

### 4.5 API route kit

New `lib/api.ts`: `getClientIp(req)` (one fallback string), `readJson(req, schema)` returning a discriminated result with a standard 400/422, `apiError(message, status, code?)` matching `types/schema.ts:ApiError`, and a rate-limit wrapper enforcing `{feature}:{scope}:{id}` keys with consistent 429s. Adopted route-by-route; the reporter flow (`app/api/issues/route.ts`, `app/api/upload/route.ts`) keeps its deliberately generic messages.

Deliberately unchanged: the `IDataAdapter` layer (`lib/db/`) is the right seam for own-data backends and needs hardening, not reshaping; `lib/plans.ts` stays the single plan authority (it just gets typed inputs for free); middleware keeps its current role. One server-side guard should ride along: reject `backend: "sheets" | "airtable"` in `app/api/organizations/route.ts` until those adapters are exercised, closing the API/UI mismatch noted in `CONCERNS.md`.

## 5. Sequenced refactor steps

Ordered smallest-safe-first. Steps 1–3 change no behavior and are prerequisites for 4 and 6. Estimates assume the current codebase size (25 API routes, ~110 source files).

| # | Step | Touches | Effort | Risk |
|---|---|---|---|---|
| 1 | Type the org: extend `Organization` in `types/schema.ts`, make `getOrgForUser(): Promise<Organization \| null>`, delete the ~42 casts | `lib/auth.ts` + 23 consumer files, mechanical | 0.5 day | Low — compiler verifies every site; no runtime change |
| 2 | Single service client: add `lib/supabase/service.ts`, replace 25 local factories + 1 inline | 26 files, pure import swap | 1–2 h | Trivial |
| 3 | API kit: `lib/api.ts` (`getClientIp`, `readJson`, `apiError`, rate-limit wrapper); adopt in auth + issues + upload routes first, rest opportunistically; stop returning raw `error.message` in `app/api/organizations/route.ts`, `app/api/labels/{history,configured}/route.ts` | ~14 routes over time | 0.5 day initial | Low |
| 4 | Org context + roles: `lib/org-context.ts` (React `cache()`, role included); migrate the 28 `getOrgForUser` call sites; enforce `owner` on `app/api/organizations/route.ts` PATCH, `app/api/org/logo/route.ts`, `app/api/vouchers/redeem/route.ts`, `app/api/invites/route.ts` POST, `app/api/stripe/checkout/route.ts`; add the missing rate limit to `app/api/issues/[id]/route.ts` | `lib/auth.ts` stays as a shim; 23 files | 1 day | Medium — role gating is a behavior change; announce to existing members |
| 5 | Profiles table: migration 013 + backfill, replace 3 `listUsers` sites and the `getUserById` fan-out, move `recovery_email` | `app/api/auth/send-to-recovery/route.ts`, `app/api/labels/{history,configured}/route.ts`, `admin-tool/lib/create-pilot.js`, settings UI | 1 day | Medium — recovery flow needs a manual end-to-end check |
| 6 | Audit-log seam: migration 014 + `lib/audit.ts`, instrument ~10 mutating routes and the admin tool | routes from 4.4 | 1 day | Low — additive, fire-and-forget |
| 7 | Billing correctness riders: webhook checks `plan_source` before downgrading (`app/api/stripe/webhook/route.ts:99-123`); voucher redemption becomes one SQL function with `use_count < max_uses` guard (`app/api/vouchers/redeem/route.ts:83-95`); server-side block on unhardened backends in `app/api/organizations/route.ts` | 3 files + 1 migration | 0.5 day | Low, but write the first API tests here — this is the money path |
| 8 | Active-org groundwork: `getOrgContext(orgId?)` validated against membership; deterministic ordering already landed in 4 | `lib/org-context.ts` | 0.5 day | Low — full multi-org UI is a separate milestone |

Total: roughly 5–6 working days spread across independent PRs. After step 4, SAML SSO has a policy attachment point, audit logging (step 6) satisfies the first procurement questionnaire line, multi-org is one function change away, and new Enterprise org columns arrive typed. Two operational riders from `CONCERNS.md` belong alongside this work but aren't refactors: commit `admin-tool/` to git, and stand up a test runner in step 7 so the billing changes land with the first real tests.
