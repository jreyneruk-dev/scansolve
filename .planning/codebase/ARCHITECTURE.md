<!-- refreshed: 2026-07-05 -->
# Architecture

**Analysis Date:** 2026-07-05

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     Next.js 15 App Router (Vercel)                   │
├───────────────────────┬─────────────────────┬────────────────────────┤
│  Public reporter UI   │   Manager UI        │   Marketing pages      │
│  `app/scan/`          │   `app/dashboard/`  │   `app/page.tsx`,      │
│  `app/commission/`    │   `app/onboarding/` │   `app/pricing/` etc.  │
└──────────┬────────────┴──────────┬──────────┴────────────────────────┘
           │                       │
           ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  `middleware.ts` — session refresh, auth gate on /dashboard +        │
│  /onboarding, security headers (HSTS, CSP, X-Frame-Options, etc.)    │
└──────────┬───────────────────────┬───────────────────────────────────┘
           │                       │
           ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  API routes `app/api/**/route.ts`  +  Server Components              │
│  (zod validation, rate limiting, auth checks)                        │
└──────────┬───────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Service layer `lib/` — auth, plans, locations, labels, crypto,      │
│  rate-limit, email, push, storage, sanitize                          │
└──────────┬──────────────────────────────┬────────────────────────────┘
           │ issue data (pluggable)       │ control-plane data (fixed)
           ▼                              ▼
┌─────────────────────────┐   ┌───────────────────────────────────────┐
│  `lib/db/` IDataAdapter │   │  Supabase (service role client)        │
│  Supabase | Sheets |    │   │  organizations, org_members, locations,│
│  Airtable adapters      │   │  labels, invites, vouchers, push subs  │
└─────────────────────────┘   └───────────────────────────────────────┘
```

External services: Supabase (auth + Postgres + storage), Stripe (billing), Resend (email), Anthropic API (`app/api/ai/suggest/route.ts`), web-push (notifications), Upstash Redis (optional rate limiting).

A separate, local-only Node.js admin server lives in `admin-tool/server.js` (see Entry Points).

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Middleware | Session refresh, `/dashboard` + `/onboarding` auth gate, all security headers + CSP | `middleware.ts` |
| Auth helpers | `requireAuth()`, `getOptionalUser()`, `getOrgForUser()` (org_members first, `owner_id` fallback) | `lib/auth.ts` |
| Adapter factory | `getAdapter(orgId)` — reads org `backend` field, decrypts credentials, returns adapter | `lib/db/index.ts` |
| Adapter contract | `IDataAdapter` interface: createIssue, getIssuesByOrg, getIssueById, updateIssue | `lib/db/adapter.ts` |
| Adapters | Supabase (default), Google Sheets, Airtable implementations | `lib/db/supabase-adapter.ts`, `lib/db/sheets-adapter.ts`, `lib/db/airtable-adapter.ts` |
| Plan gating | `getEffectivePlan()`, `getPlanLimits()`, `getOrgLimits()` — single source of truth for tier limits | `lib/plans.ts` |
| Location lookups | Org-scoped `getLocationByOrgAndUID()`, `getOrgPlanByNumber()`, CRUD via service role | `lib/locations.ts` |
| Label geometry / UIDs | `SHEET_TYPES` Avery geometry, `formatUID()` (`10${yy}${seq padded to 6}`) | `lib/labels.ts` |
| Credential encryption | AES-256-GCM encrypt/decrypt, 64-char hex `ENCRYPTION_KEY` required | `lib/crypto.ts` |
| Rate limiting | Fixed-window `checkRateLimit()` — Upstash REST, in-memory Map fallback | `lib/rate-limit.ts` |
| Input sanitization | `sanitizeCategory()` and friends | `lib/sanitize.ts` |
| Email | Resend-based invites/notifications | `lib/email.ts` |
| Push | `sendPush()` via web-push, dead-subscription pruning | `lib/push.ts` |
| Storage | Supabase storage helpers (signed URLs for `issue-photos` bucket) | `lib/storage.ts` |
| Env fallback | `getServerEnv()` — process.env with `.env.local` file fallback for dev | `lib/server-env.ts` |
| Supabase clients | Cookie-based SSR client (anon key) and browser client | `lib/supabase/server.ts`, `lib/supabase/client.ts` |
| Domain types | `Organization`, `Location`, `Issue`, `SurveyConfig`, input/filter types | `types/schema.ts` |
| Admin portal | Local-only HTTP server on 127.0.0.1:3001 using service role key directly | `admin-tool/server.js` |

## Pattern Overview

**Overall:** Serverless Next.js App Router monolith with a pluggable data-adapter layer for issue storage and a fixed Supabase control plane for everything else.

**Key Characteristics:**
- Server Components + API route handlers; client components only where interactivity is needed (forms, dashboards)
- Two-tier auth: authenticated managers vs. anonymous reporters funneled through service-role API routes
- Per-org backend choice (Supabase/Sheets/Airtable) resolved at request time by `lib/db/index.ts:getAdapter()`
- Plan gating centralized in `lib/plans.ts` and enforced server-side
- Defense-in-depth on public routes: rate limit → zod validation → org-scoped lookup → category allowlist → generic errors

## Layers

**Edge / Middleware:**
- Purpose: Auth gating and security headers on every response
- Location: `middleware.ts`
- Contains: Supabase session refresh via `@supabase/ssr`, redirect-to-`/auth` for `/dashboard` and `/onboarding`, HSTS/CSP/COOP/CORP/Permissions-Policy headers
- Depends on: Supabase anon client
- Used by: All routes (matcher excludes `_next/static`, images, favicon)

**Presentation (App Router):**
- Purpose: Pages and layouts, mostly Server Components
- Location: `app/` (pages), `components/` (shared UI)
- Contains: Reporter survey (`app/scan/[org_number]/[uid]/page.tsx`), commissioning (`app/commission/[org_number]/[uid]/page.tsx`), dashboard pages, marketing pages
- Depends on: `lib/` services directly (Server Components call `requireAuth`, `getOrgForUser`, `getAdapter` themselves)
- Used by: Browsers

**API layer:**
- Purpose: All mutations and unauthenticated data access
- Location: `app/api/**/route.ts` (25 route handlers)
- Contains: zod schemas defined inline per route, rate limiting, auth checks, service-role Supabase clients
- Depends on: `lib/` services, `lib/db/` adapters
- Used by: Client components (`fetch`), Stripe webhooks, reporter survey form

**Service layer:**
- Purpose: Reusable domain logic, shared by pages and API routes
- Location: `lib/`
- Contains: auth, plans, locations, labels, crypto, rate-limit, sanitize, email, push, storage
- Depends on: Supabase service role client, external SDKs
- Used by: `app/` and `app/api/`

**Data layer:**
- Purpose: Issue persistence behind `IDataAdapter`; everything else via direct Supabase service-role queries
- Location: `lib/db/`
- Contains: adapter interface, three implementations, factory
- Depends on: `lib/crypto.ts` (credential decryption), `@supabase/supabase-js`, `googleapis`, Airtable REST
- Used by: `app/api/issues/`, `app/api/issues/[id]/`, dashboard pages

## Data Flow

### Reporter Issue Submission (primary public path)

1. Reporter scans QR → GET `/scan/{org_number}/{uid}` → `app/scan/[org_number]/[uid]/page.tsx` calls `getLocationByOrgAndUID()` + `getOrgPlanByNumber()` (`lib/locations.ts`) via service role; uncommissioned UIDs show an Activate link to `/commission/...`
2. `components/survey/SurveyForm.tsx` POSTs to `/api/issues` → `app/api/issues/route.ts`
3. Route: IP rate limit (10/60s) → zod parse (`CreateIssueSchema`, photo_url must be a Supabase signed URL) → per-UID rate limit (20/hr) → org-scoped location lookup → category allowlist check against `location.survey_config.categories`
4. `getAdapter(location.org_id)` (`lib/db/index.ts`) decrypts org backend credentials and writes via the org's adapter
5. Best-effort push notify (`notifyOrgOfNewIssue` in `app/api/issues/route.ts` — Prime-gated, capped 200/day/org, never throws)
6. 201 response with the location's `survey_config.success_message`; redirect to `/scan/[org_number]/[uid]/success`

### Manager Dashboard

1. GET `/dashboard` → `middleware.ts` verifies session (redirect to `/auth` if not)
2. `app/dashboard/page.tsx`: `requireAuth()` → `getOrgForUser(user.id)` (`lib/auth.ts` — service role, org_members first, owner_id fallback; no org → pending-invite check → `/onboarding`)
3. `getAdapter(org.id)` fetches issues via the org's configured backend; rendered by `components/dashboard/IssueList.tsx`
4. Mutations (status changes, etc.) go through `app/api/issues/[id]/route.ts`

### Label Commissioning

1. Manager reserves label sheets → `app/api/labels/reserve/route.ts` (auth + rate limit 5/hr) allocates sequential UIDs via `formatUID()` (`lib/labels.ts`)
2. Printing via `components/labels/PrintPreviewModal.tsx` using `SHEET_TYPES` geometry; QR encodes `{NEXT_PUBLIC_APP_URL}/scan/{org_number}/{uid}`
3. First scan of an uncommissioned label → `/commission/[org_number]/[uid]` (`app/commission/[org_number]/[uid]/page.tsx`, authenticated) → `components/dashboard/CommissionForm.tsx` creates the location

### Billing

1. `app/api/stripe/checkout/route.ts` creates a Checkout session
2. `app/api/stripe/webhook/route.ts` verifies the signature and calls `setOrgPlan()` → updates `organizations.plan` / `plan_source` / `stripe_*` columns via service role
3. Vouchers: `app/api/vouchers/redeem/route.ts` sets `plan` + `plan_expires_at`; expiry is handled at read time by `getEffectivePlan()`

**State Management:**
- Server state: Supabase (or per-org Sheets/Airtable for issues). No global client store — local React `useState` only (Zustand reserved for future complexity per `CLAUDE.md`)
- Session: Supabase auth cookies, refreshed in `middleware.ts`

## Key Abstractions

**IDataAdapter:**
- Purpose: Per-org pluggable issue storage (Supabase default, Google Sheets, Airtable)
- Examples: `lib/db/adapter.ts` (interface), `lib/db/supabase-adapter.ts`, `lib/db/sheets-adapter.ts`, `lib/db/airtable-adapter.ts`
- Pattern: Factory (`lib/db/index.ts:getAdapter(orgId)`) reads `organizations.backend`, decrypts `backend_credentials` with `lib/crypto.ts:decrypt()`, falls back to `SupabaseAdapter` on any failure. Only issue CRUD goes through the adapter — orgs, locations, labels, invites, plans always live in Supabase.

**Effective plan:**
- Purpose: One function resolves tier including voucher expiry (`prime` with past `plan_expires_at` → `free`)
- Examples: `lib/plans.ts:getEffectivePlan()`, `getPlanLimits()`, `getOrgLimits()`; consumed in `app/api/issues/route.ts`, `app/scan/[org_number]/[uid]/page.tsx`, `app/dashboard/page.tsx`
- Pattern: Read-time resolution — expiry is never a cron job; `LIMITS` table in `lib/plans.ts` is the single source of feature flags (maxInvitees, allowedSheetTypes, hasAds, hasOwnLogo, hasSmsWhatsApp)

**Service-role client:**
- Purpose: Server-side Supabase access that bypasses RLS for unauthenticated reporter flows and for `getOrgForUser()` bootstrap
- Examples: local `getServiceClient()` functions duplicated in `lib/auth.ts`, `lib/db/index.ts`, `lib/locations.ts`, `lib/db/supabase-adapter.ts`, `app/api/issues/route.ts`, `app/dashboard/page.tsx`, and others
- Pattern: Per-file factory function creating `createClient(url, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })` — intentionally not a shared singleton

**Org-scoped UID lookup:**
- Purpose: UIDs are unique per org, not globally; every public lookup is `(org_number, uid)`
- Examples: `lib/locations.ts:getLocationByOrgAndUID()`; legacy global lookup `getLocationByUID()` kept for backward compat
- Pattern: org_number → org_id → locations.uid two-step query

**Rate limiting:**
- Purpose: Abuse prevention on every public and expensive route
- Examples: `lib/rate-limit.ts:checkRateLimit(key, limit, windowSecs)`; keys like `issues:ip:{ip}`, `issues:uid:{org}:{uid}`, `labels:reserve:user:{id}`, `push_notify:org:{id}`
- Pattern: Fixed window; Upstash Redis REST when configured, in-memory `Map` fallback (per warm serverless instance)

## Entry Points

**`middleware.ts`:**
- Location: repo root
- Triggers: Every request except static assets (see `config.matcher`)
- Responsibilities: Session refresh, auth gate, all security headers and CSP

**App Router pages:**
- Location: `app/**/page.tsx`; root layout `app/layout.tsx`; error boundaries `app/global-error.tsx`, `app/scan/[org_number]/[uid]/error.tsx`, `app/commission/[org_number]/[uid]/error.tsx`
- Triggers: Browser navigation
- Responsibilities: Server-rendered UI; reporter flow, manager dashboard, marketing

**API route handlers:**
- Location: `app/api/**/route.ts` (25 handlers: issues, locations, labels, invites, onboarding, org, auth helpers, ai/suggest, stripe checkout+webhook, support, upload, vouchers, push)
- Triggers: `fetch` from client components; Stripe webhook POSTs
- Responsibilities: All writes and unauthenticated reads

**`app/auth/callback/route.ts`:**
- Triggers: Supabase magic-link redirect
- Responsibilities: Exchanges the code for a session and redirects

**Service worker `public/sw.js`** (registered by `components/ServiceWorkerRegister.tsx`):
- Triggers: Push events
- Responsibilities: Web push notification display

**`admin-tool/server.js`** (untracked, local-only):
- Triggers: `npm start` in `admin-tool/`; listens on 127.0.0.1:3001
- Responsibilities: Internal customer-service portal (org/plan management, vouchers, comp grants, pilot/demo creation via `admin-tool/lib/create-pilot.js` and `admin-tool/lib/demo-org.js`). Reads `SUPABASE_SERVICE_ROLE_KEY` from the parent `.env.local`, HMAC-signed session cookie, never deployed.

## Architectural Constraints

- **Serverless execution:** Runs on Vercel lambdas. Module-level state (`memStore` in `lib/rate-limit.ts`, `_cache` in `lib/server-env.ts`) persists only per warm instance — the in-memory rate limiter is not distributed; Upstash env vars enable the distributed path.
- **Global state:** No app-level singletons besides those two module caches. Supabase clients are created per call.
- **Circular imports:** None detected. Dependency direction is strictly `app/` → `lib/` → external SDKs; `lib/db/` depends on `lib/crypto.ts` and `types/schema.ts` only.
- **Adapter scope:** `IDataAdapter` covers issues only. Orgs, locations, labels, members, invites, and plans are always Supabase, even for Sheets/Airtable orgs.
- **RLS posture:** Public writes deliberately bypass RLS via the service role; RLS protects direct client access (migrations `supabase/migrations/005_security_hardening.sql`, `006_fix_org_members_rls.sql`). The anon key is never used for writes.
- **No test suite:** No test framework configured; CI (`.github/workflows/ci.yml`) runs `npm run lint` + `npm run build` only.
- **Deploys:** PR-only to `main`; never `vercel --prod` from CLI (see root `CLAUDE.md`).

## Anti-Patterns

### Checking `org.plan` directly

**What happens:** Code compares `org.plan === "prime"` without accounting for voucher expiry.
**Why it's wrong:** Expired vouchers still have `plan = 'prime'` in the DB with a past `plan_expires_at`; direct checks grant paid features to lapsed orgs. The header comment in `lib/plans.ts` explicitly forbids this.
**Do this instead:** `getEffectivePlan(org)` then `getPlanLimits(plan)` — or `getOrgLimits(org)` in one call (`lib/plans.ts`).

### Writing issue data outside the adapter

**What happens:** Querying the `issues` table directly with a Supabase client from a route or page.
**Why it's wrong:** Orgs on Sheets/Airtable backends would silently miss those writes/reads — their issues do not live in Supabase.
**Do this instead:** `const adapter = await getAdapter(orgId)` (`lib/db/index.ts`) and use the `IDataAdapter` methods.

### Using the anon-key client for public-route writes

**What happens:** A public (reporter-facing) API route creates the cookie-based anon client from `lib/supabase/server.ts` for a write.
**Why it's wrong:** Reporters are unauthenticated; RLS blocks the write, or worse, would require loosening RLS. The security model is "reporters never touch Supabase directly."
**Do this instead:** A local `getServiceClient()` with `SUPABASE_SERVICE_ROLE_KEY` inside the route handler, after rate limiting and zod validation (pattern: `app/api/issues/route.ts`).

### Leaking existence information in public error responses

**What happens:** Returning field-level validation errors or "UID not found" details on unauthenticated routes.
**Why it's wrong:** Enables org/UID enumeration and schema probing.
**Do this instead:** Generic messages — `"Invalid submission."` (422), `"Invalid QR code."` (404) — as in `app/api/issues/route.ts`.

## Error Handling

**Strategy:** Fail-soft with safe fallbacks for infrastructure; fail-closed with generic messages for public input.

**Patterns:**
- Adapter init failure → log + fall back to `SupabaseAdapter` (`lib/db/index.ts`)
- Supabase unreachable in middleware → request allowed through; route handlers enforce auth themselves (`middleware.ts`)
- Best-effort side effects (push notify, email) wrapped in try/catch, never block the primary response (`app/api/issues/route.ts:notifyOrgOfNewIssue`)
- Public routes return generic errors; authenticated routes may return `parsed.error.flatten()` (`app/api/labels/reserve/route.ts`)
- Route error boundaries: `app/scan/[org_number]/[uid]/error.tsx`, `app/commission/[org_number]/[uid]/error.tsx`, `app/global-error.tsx`
- `lib/crypto.ts` throws hard on missing/malformed `ENCRYPTION_KEY` (fail-fast at first use)

## Cross-Cutting Concerns

**Logging:** `console.error`/`console.warn` with bracketed route prefixes, e.g. `[issues]` — no logging framework.
**Validation:** zod schemas defined inline per API route; `lib/sanitize.ts` for category normalization; signed-URL refinement for `photo_url`.
**Authentication:** Managers — Supabase magic link (`app/api/auth/magic-link/route.ts`, `app/auth/callback/route.ts`), enforced by `middleware.ts` and `lib/auth.ts:requireAuth()`; org membership via `getOrgForUser()`. Reporters — none; service-role API routes with rate limiting. Multi-member orgs via `org_members` (migration `supabase/migrations/003_org_members_invites.sql`) with `owner_id` fallback.
**Rate limiting:** `lib/rate-limit.ts:checkRateLimit()` at the top of public/expensive routes.
**Secrets:** Third-party backend credentials AES-256-GCM encrypted (`lib/crypto.ts`) before storage in `organizations.backend_credentials`; decrypted only server-side in `lib/db/index.ts`.
**Security headers:** Centralized in `middleware.ts` (HSTS, CSP with prod/dev script-src split, frame denial, COOP/CORP, Permissions-Policy).

---

*Architecture analysis: 2026-07-05*
