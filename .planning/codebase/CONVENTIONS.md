# Coding Conventions

**Analysis Date:** 2026-07-05

## Naming Patterns

**Files:**
- Feature components: PascalCase matching the component name — `components/survey/SurveyForm.tsx`, `components/dashboard/IssueDetail.tsx`, `components/labels/PrintPreviewModal.tsx`
- shadcn-style UI primitives: lowercase — `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/badge.tsx`
- Lib modules: kebab-case or single word — `lib/rate-limit.ts`, `lib/server-env.ts`, `lib/sanitize.ts`, `lib/crypto.ts`
- Adapters: `{backend}-adapter.ts` — `lib/db/supabase-adapter.ts`, `lib/db/sheets-adapter.ts`, `lib/db/airtable-adapter.ts`
- Next.js special files follow framework names: `page.tsx`, `route.ts`, `layout.tsx`, `error.tsx`, `middleware.ts`
- Dynamic route segments use snake_case params: `app/scan/[org_number]/[uid]/page.tsx`

**Functions:**
- camelCase throughout: `checkRateLimit`, `getOrgForUser`, `sanitizeCategory`, `verifyMagicBytes`
- Server helpers use imperative verb prefixes: `require*` (redirects on failure — `lib/auth.ts:requireAuth`), `get*` (returns null on miss — `getOptionalUser`, `getOrgForUser`), `is*` for boolean validators (`lib/sanitize.ts:isUUID`, `isSafeUID`)
- Private route-file helpers are defined as plain functions above the exported handler — `notifyOrgOfNewIssue` in `app/api/issues/route.ts`

**Variables:**
- camelCase for locals; API payload fields and DB columns are snake_case (`org_number`, `photo_url`, `contact_email`, `survey_config`) — destructured as-is, not renamed
- Zod schemas: PascalCase with `Schema` suffix — `CreateIssueSchema` in `app/api/issues/route.ts`
- Module-level constants: SCREAMING_SNAKE or PascalCase maps — `ALLOWED_IMAGE_TYPES`, `MIME_TO_EXT`, `MAGIC` in `lib/sanitize.ts`

**Types:**
- PascalCase interfaces, no `I` prefix except the adapter interface `IDataAdapter` (`lib/db/adapter.ts`)
- String-literal union types for enums: `type OrgPlan = "free" | "prime" | "enterprise"` (`types/schema.ts`)
- Input/filter types suffixed `Input`/`Filters`: `CreateIssueInput`, `UpdateIssueInput`, `IssueFilters` (`types/schema.ts`)
- Component prop interfaces: `{Component}Props` — `SurveyFormProps` in `components/survey/SurveyForm.tsx`

## Code Style

**Formatting:**
- No Prettier or Biome config — formatting is by hand/editor default
- Double quotes, semicolons, 2-space indent, trailing commas in multiline literals
- Occasional aligned assignments in lib code (`lib/rate-limit.ts` — `const url   = ...`)

**Linting:**
- ESLint 8 via `.eslintrc.json`: extends `next/core-web-vitals` + `next/typescript`
- One custom rule: `@typescript-eslint/no-unused-vars` errors, with `^_` ignore pattern for args/vars/caught errors — prefix intentionally-unused values with `_`
- Run with `npm run lint` (`next lint`); CI fails the PR if lint fails

**TypeScript:**
- `strict: true` in `tsconfig.json`; target ES2017, `moduleResolution: bundler`
- Non-null assertions (`!`) accepted for env vars known to exist: `process.env.NEXT_PUBLIC_SUPABASE_URL!` (`lib/auth.ts`)
- Supabase join results cast via `as unknown as T` where the generated types don't fit (`lib/auth.ts:47`)
- Request bodies typed `unknown` then narrowed with Zod (`app/api/issues/route.ts:101`)

## Import Organization

**Order (observed, not enforced by tooling):**
1. React / Next.js (`next/server`, `next/navigation`, `react`)
2. External packages (`@supabase/supabase-js`, `zod`)
3. Internal `@/` aliases (`@/lib/...`, `@/components/...`, `@/types/schema`)
4. Icons last (`lucide-react`)

**Path Aliases:**
- `@/*` → project root (`tsconfig.json` paths). Always use `@/lib/...`, `@/components/...`, `@/types/...` — no deep relative imports

**Type imports:**
- `import type { ... }` used for type-only imports (`lib/db/adapter.ts`, `components/survey/SurveyForm.tsx`)

## Error Handling

**API routes (`app/api/**/route.ts`):**
- Parse JSON in try/catch → 400 `{ error: "Invalid JSON" }`
- Validate with `Schema.safeParse()` → 422 with a **generic** message (deliberately not leaking field names or existence — see `app/api/issues/route.ts:109-112, 127-130`)
- Rate-limit checks return 429 with a `Retry-After` header
- Error response shape is always `{ error: string }` (`ApiError` in `types/schema.ts`)
- Best-effort side effects (push notifications, emails) are wrapped so they never throw or block the main response — see `notifyOrgOfNewIssue` in `app/api/issues/route.ts:17-61`

**Lib layer (`lib/`):**
- Throws plain `Error` with descriptive message on failure: `lib/locations.ts:79`, `lib/storage.ts:27`, `lib/email.ts:11`, `lib/crypto.ts:7`
- Missing required env vars fail fast with `throw new Error("X not set")`
- Fallback-on-failure pattern where degraded service is acceptable: `lib/rate-limit.ts` silently falls back from Upstash to in-memory

**Client components:**
- Local `error: string | null` state; `catch (err) { setError(err instanceof Error ? err.message : "fallback") }` — `components/survey/SurveyForm.tsx:76-79`
- Route-level error boundaries: `app/scan/[org_number]/[uid]/error.tsx`, `app/commission/[org_number]/[uid]/error.tsx`, `app/global-error.tsx` — each logs via `console.error` in `useEffect` and offers a `reset()` retry button

## Logging

**Framework:** `console` only — no logging library, no error tracking service (Sentry etc. is a known gap, see `docs/FOUNDATIONS-REVIEW.md`)

**Patterns:**
- Bracketed context prefix: `console.error("[issues] push notify failed:", ...)`, `"[auth/magic-link] ..."`, `"[commission] ..."` — prefix names the route/module
- Log the error message, not the raw object, for caught errors: `err instanceof Error ? err.message : "unknown"` (`app/api/issues/route.ts:59`)
- `console.warn` for expected-but-notable events (rate cap reached, `app/api/issues/route.ts:42`)
- Never log secrets, tokens, or full request bodies

## Comments

**When to Comment:**
- Security rationale is always explained inline — why service role is safe here (`lib/auth.ts:34-37`), why photo_url is restricted to Supabase signed URLs (`app/api/issues/route.ts:68`), why errors are generic (`app/api/issues/route.ts:110, 128`)
- Section dividers in longer route handlers: `// ── Rate limit by IP ──...──` (`app/api/issues/route.ts`)
- Backwards-compat shims flagged: `// Backwards compat: orgs created before the org_members migration` (`lib/auth.ts:49`)

**JSDoc/TSDoc:**
- Lib utilities carry JSDoc blocks describing purpose and params — `lib/sanitize.ts`, `lib/rate-limit.ts:29-35`, `lib/auth.ts:13`
- Components and pages generally have no JSDoc; the code plus prop interfaces are the documentation

## Function Design

**Size:** Route handlers are linear top-to-bottom guard-clause pipelines (rate limit → parse → validate → lookup → act → respond). Helpers extracted when a concern is self-contained (`notifyOrgOfNewIssue`)

**Parameters:** Positional for lib functions (`checkRateLimit(key, limit, windowSecs)`); single destructured props object for components

**Return Values:** `null` for not-found (`getIssueById`, `getOptionalUser`), throw for genuine failures, structured result objects for multi-value returns (`RateLimitResult` in `lib/rate-limit.ts`)

**Guard clauses:** Early return on invalid input rather than nested conditionals — pervasive in API routes and `lib/sanitize.ts:safeNextPath`

## Module Design

**Exports:** Named exports everywhere except Next.js pages/layouts/error boundaries, which must be default exports. Zero default exports in `components/` other than framework-required files

**Barrel Files:** Only `lib/db/index.ts`, which is a real module (exports `getAdapter(orgId)` — reads org backend config, decrypts credentials, returns the right `IDataAdapter`). No re-export-only barrels

**Client/Server split:**
- `"use client"` on the first line of interactive components (33 files); server components and all `lib/` code omit it
- Server-only concerns live in `lib/` (`lib/auth.ts`, `lib/crypto.ts`, `lib/server-env.ts`) and are imported only from server contexts
- Pattern: server `page.tsx` fetches data, passes props to a client component (`app/scan/[org_number]/[uid]/page.tsx` → `components/survey/SurveyForm.tsx`)

## Security Conventions (enforced patterns — follow these)

- Reporters never touch Supabase directly; public API routes use the service role key server-side only (`app/api/issues/route.ts`, `lib/auth.ts:getServiceClient`)
- All user input through Zod schemas with max lengths and format regexes; 13 of 24 API routes import `zod` — the rest handle non-body requests (webhooks, GET) or FormData with manual validation
- Sanitize user strings via `lib/sanitize.ts` before storing/emailing/rendering (`escapeHtml`, `stripTags`, `sanitizeCategory`)
- Redirect targets validated with `safeNextPath`/`sameOriginUrl` (`lib/sanitize.ts:108-127`)
- Uploads: MIME allowlist + magic-byte verification + extension derived from MIME, never the filename (`lib/sanitize.ts:55-101`)
- Rate limit every public POST via `lib/rate-limit.ts:checkRateLimit()` keyed by IP and/or resource
- Third-party backend credentials encrypted AES-256-GCM via `lib/crypto.ts` before storage
- The `.claude/skills/vibe-security` skill defines the audit posture: never trust the client; prices, roles, plan status, and rate counters are server-enforced

## UI Conventions (from `/Users/john/claude/CLAUDE.md` + project `CLAUDE.md`) — adherence check

- **Icons: `lucide-react` only, no inline SVGs unless custom.** Largely followed — components import from `lucide-react` (`Camera, Loader2, X, ChevronRight` in `SurveyForm.tsx`). Three files contain inline `<svg>`: `components/ui/ScanSolveLogo.tsx` (custom logo — allowed), `components/labels/LabelSheet.tsx` (QR label rendering — custom/print output, allowed), `app/global-error.tsx` (minor deviation)
- **Palette: Slate-900 text / Slate-50 background / Indigo-600 actions / Emerald-600 success.** Followed in spirit; in practice the code frequently upgrades actions to indigo→violet gradients (`bg-gradient-to-br from-indigo-500 to-violet-600` in `SurveyForm.tsx:98`, `from-indigo-600 to-violet-600` in `app/scan/[org_number]/[uid]/error.tsx`) and uses a `glass-card` utility class. Match the existing gradient/glass style rather than flat Indigo-600 when editing these surfaces
- **44×44px minimum touch targets.** Followed — `min-h-[48px]` category buttons (`SurveyForm.tsx:96`), `min-h-[44px]` retry buttons (error boundaries); shadcn `Button` `lg` size is `h-11` (44px)
- **Loading states:** `loading` boolean state + `Loader2` spinner icon; buttons disabled while pending
- **Styling:** Tailwind utility classes exclusively; class merging via `cn()` from `lib/utils.ts` (clsx + tailwind-merge); variants via `class-variance-authority` in `components/ui/*` primitives

---

*Convention analysis: 2026-07-05*
