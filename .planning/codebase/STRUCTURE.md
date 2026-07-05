# Codebase Structure

**Analysis Date:** 2026-07-05

## Directory Layout

```
qr-issue-tracker/
├── app/                        # Next.js App Router — pages, layouts, API routes
│   ├── api/                    # 25 route handlers (all writes + public reads)
│   │   ├── ai/suggest/         # Anthropic-powered category suggestions
│   │   ├── auth/               # check-email, magic-link, send-to-recovery
│   │   ├── invites/            # Team invites (+ [token] accept)
│   │   ├── issues/             # Public issue create + [id] update
│   │   ├── labels/             # configured, history, reserve
│   │   ├── locations/          # Location CRUD
│   │   ├── onboarding/         # Org creation
│   │   ├── org/logo/           # Logo upload (plan-gated)
│   │   ├── organizations/      # Org updates
│   │   ├── push/               # subscribe / unsubscribe
│   │   ├── scan/[org_number]/[uid]/  # Public scan data
│   │   ├── stripe/             # checkout, webhook
│   │   ├── support/            # chat, email
│   │   ├── upload/             # Photo upload (signed URLs)
│   │   └── vouchers/redeem/    # Voucher redemption
│   ├── auth/                   # Magic-link sign-in page + callback route
│   ├── commission/[org_number]/[uid]/  # Activate an uncommissioned label (auth)
│   ├── dashboard/              # Manager area (auth-protected by middleware)
│   │   ├── billing/  insights/  issues/[id]/  labels/  settings/
│   │   └── locations/          # (empty directory — no page yet)
│   ├── onboarding/             # First-run org setup (auth-protected)
│   ├── scan/[org_number]/[uid]/       # Reporter survey (public) + /success
│   ├── about/  pricing/  privacy/  invite/[token]/   # Marketing / public
│   ├── layout.tsx  page.tsx  global-error.tsx  robots.ts  sitemap.ts
├── components/                 # React components (client + shared)
│   ├── ui/                     # Low-level primitives (button, card, input, badge…)
│   ├── dashboard/              # Dashboard feature components
│   ├── survey/  labels/  posters/  onboarding/  invite/  pricing/  support/
│   └── features/animation/     # Landing-page hero animation engine
├── lib/                        # Service layer (server-side domain logic)
│   ├── db/                     # IDataAdapter + Supabase/Sheets/Airtable adapters
│   └── supabase/               # SSR (server.ts) and browser (client.ts) clients
├── types/                      # schema.ts — all shared domain types
├── supabase/migrations/        # Sequential SQL migrations 001–012
├── middleware.ts               # Auth gate + security headers (repo root)
├── public/                     # Static assets, sw.js, manifest.json, icons
├── docs/                       # FOUNDATIONS-REVIEW, GTM-STRATEGY, PILOT-TOOLING-PLAN
├── admin-tool/                 # Untracked local-only admin server (own package.json)
│   └── lib/                    # create-pilot.js, demo-org.js
├── scripts/                    # (empty)
├── .github/workflows/ci.yml   # Lint + build on PRs and main
├── .claude/skills/vibe-security/  # Security-audit skill (SKILL.md + references/)
├── .planning/codebase/         # GSD codebase maps (this document)
└── .security-audits/           # Audit output
```

## Directory Purposes

**`app/`:**
- Purpose: All routes — Server Component pages and API route handlers
- Contains: `page.tsx`, `layout.tsx`, `route.ts`, `error.tsx` files following App Router conventions
- Key files: `app/layout.tsx` (root layout), `app/dashboard/layout.tsx` (dashboard shell with `DashboardNav`), `app/api/issues/route.ts` (canonical public API route pattern)

**`app/api/`:**
- Purpose: Every mutation and unauthenticated read; the only place reporters' data enters the system
- Contains: One `route.ts` per endpoint, with inline zod schemas, rate limiting, and per-file `getServiceClient()` helpers
- Key files: `app/api/issues/route.ts`, `app/api/labels/reserve/route.ts` (authenticated pattern), `app/api/stripe/webhook/route.ts`

**`components/`:**
- Purpose: All React components, grouped by feature area
- Contains: `components/ui/` primitives (lowercase filenames, shadcn-style: `button.tsx`, `card.tsx`, `select.tsx`) plus PascalCase feature components
- Key files: `components/survey/SurveyForm.tsx` (reporter form), `components/dashboard/IssueList.tsx`, `components/labels/PrintPreviewModal.tsx`

**`lib/`:**
- Purpose: Server-side service layer shared by pages and API routes
- Contains: One concern per file — `auth.ts`, `plans.ts`, `locations.ts`, `labels.ts`, `crypto.ts`, `rate-limit.ts`, `sanitize.ts`, `email.ts`, `push.ts`, `storage.ts`, `server-env.ts`, `utils.ts`
- Key files: `lib/db/index.ts` (adapter factory), `lib/plans.ts` (plan gating), `lib/auth.ts`

**`types/`:**
- Purpose: Shared domain types imported everywhere via `@/types/schema`
- Contains: `types/schema.ts` only — `Organization`, `Location`, `Issue`, `SurveyConfig`, input/filter/response types

**`supabase/migrations/`:**
- Purpose: Sequential SQL schema history, applied manually in order
- Contains: `001_initial.sql` … `012_push_subscriptions.sql` (org_members/invites in 003, labels in 004, RLS hardening in 005–006, plan gating in 008, Stripe columns in 010, push in 012)
- Note: The `issue-photos` storage bucket is created manually in the Supabase Dashboard (see comment in `001_initial.sql`)

**`admin-tool/`:**
- Purpose: Untracked, local-only customer-service portal (127.0.0.1:3001); plain Node `http` server, no framework
- Contains: `server.js` (1,269 lines — routing, HMAC sessions, org/plan/voucher management), `lib/create-pilot.js`, `lib/demo-org.js`, own `package.json` (deps: `@supabase/supabase-js`, `cookie`, `dotenv`)
- Reads the parent project's `.env.local` for the service role key; never deployed

**`docs/`:**
- Purpose: Strategy and review docs — `FOUNDATIONS-REVIEW.md` (read before Enterprise/audit work), `GTM-STRATEGY.md` (read before outreach/pricing work), `PILOT-TOOLING-PLAN.md`

## Key File Locations

**Entry Points:**
- `middleware.ts`: Auth gate + security headers on every request
- `app/layout.tsx`: Root layout
- `app/page.tsx`: Landing page
- `public/sw.js`: Push-notification service worker (registered by `components/ServiceWorkerRegister.tsx`)
- `admin-tool/server.js`: Local admin portal

**Configuration:**
- `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json` (path alias `@/*` → repo root)
- `.env.local` (gitignored; template `.env.local.example`)
- `.github/workflows/ci.yml`: CI (lint + build)

**Core Logic:**
- `lib/db/index.ts`: `getAdapter(orgId)` factory
- `lib/auth.ts`: `requireAuth()`, `getOrgForUser()`
- `lib/plans.ts`: `getEffectivePlan()`, `getPlanLimits()`
- `lib/labels.ts`: `SHEET_TYPES`, `formatUID()`
- `lib/locations.ts`: org-scoped UID lookups

**Testing:**
- None — no test files or test framework exist

## Naming Conventions

**Files:**
- API routes: App Router convention — `route.ts` inside a path directory; dynamic segments as `[param]` (`app/api/scan/[org_number]/[uid]/route.ts`)
- Pages: `page.tsx`, layouts `layout.tsx`, error boundaries `error.tsx`
- `lib/` modules: lowercase kebab-case or single word (`rate-limit.ts`, `server-env.ts`, `plans.ts`)
- Feature components: PascalCase matching the exported component (`SurveyForm.tsx`, `IssueList.tsx`)
- `components/ui/` primitives: lowercase shadcn-style (`button.tsx`, `card.tsx`) plus some PascalCase custom ones (`ScanSolveLogo.tsx`, `ClientDate.tsx`)
- Migrations: `NNN_description.sql`, zero-padded sequential

**Directories:**
- Route directories: lowercase, dynamic segments bracketed (`[org_number]`, `[uid]`, `[token]`, `[id]`)
- Component directories: lowercase feature names (`dashboard/`, `survey/`, `labels/`)

**Imports:**
- Always the `@/` alias (`@/lib/db`, `@/types/schema`, `@/components/ui/button`), never long relative paths

**Note:** The project-level `CLAUDE.md` mentions `/lib/adapters` and `/hooks`; in reality adapters live in `lib/db/` and no `hooks/` directory exists. Follow the actual structure.

## Where to Add New Code

**New API endpoint:**
- Handler: `app/api/<resource>/route.ts` (or `app/api/<resource>/[id]/route.ts`)
- Pattern to copy: `app/api/labels/reserve/route.ts` (authenticated) or `app/api/issues/route.ts` (public — rate limit first, zod schema inline, generic errors, local `getServiceClient()`)

**New dashboard page:**
- Page: `app/dashboard/<feature>/page.tsx` (Server Component; call `requireAuth()` + `getOrgForUser()`)
- Interactive parts: `components/dashboard/<Feature>.tsx` as a client component
- Nav link: `components/dashboard/DashboardNav.tsx`

**New public (reporter) page:**
- Page under `app/scan/` or a new top-level route; fetch data via service-role helpers in `lib/`, never the anon client

**New domain logic / service:**
- Shared helpers: new file in `lib/` (one concern per file)
- Types: add to `types/schema.ts`

**New storage backend:**
- Adapter: `lib/db/<name>-adapter.ts` implementing `IDataAdapter` (`lib/db/adapter.ts`)
- Register in `lib/db/index.ts:getAdapter()`; extend `BackendType` in `types/schema.ts`

**New plan-gated feature:**
- Add the flag to `PlanLimits` and the `LIMITS` table in `lib/plans.ts`; check via `getOrgLimits(org)` server-side

**Schema change:**
- New file `supabase/migrations/013_<description>.sql` (next sequential number)

**UI primitives:**
- `components/ui/` — lucide-react icons only, no inline SVGs; palette Slate-900/Slate-50/Indigo-600/Emerald-600; 44×44px min touch targets

## Special Directories

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes — Committed: No

**`node_modules/` (root and `admin-tool/`):**
- Generated: Yes — Committed: No

**`supabase/migrations/`:**
- Purpose: Manual-apply SQL migrations (no CLI tooling wired up)
- Generated: No — Committed: Yes

**`admin-tool/`:**
- Purpose: Local-only admin server using the service role key
- Generated: No — Committed: No (untracked by design; never deployed)

**`.claude/skills/vibe-security/`:**
- Purpose: Security-audit skill (`SKILL.md` + `references/` + `agents/`); triggers on security-related work
- Committed: Yes

**`.planning/` and `.security-audits/`:**
- Purpose: GSD planning docs and audit outputs
- Generated: By tooling/agents

**`.vercel/`:**
- Purpose: Vercel project link metadata
- Committed: No

---

*Structure analysis: 2026-07-05*
