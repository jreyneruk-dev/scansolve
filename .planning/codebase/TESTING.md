# Testing Patterns

**Analysis Date:** 2026-07-05

## Current State: No Test Suite

**There are no automated tests in this codebase.** This is a verified, documented fact — not an oversight in analysis:

- Zero `*.test.*` / `*.spec.*` files anywhere in `app/`, `components/`, `lib/`, or `types/`
- No test framework installed: `package.json` has no jest, vitest, playwright, cypress, or testing-library dependencies
- No test config files: no `jest.config.*`, `vitest.config.*`, or `playwright.config.*`
- No `test` script in `package.json` — scripts are `dev`, `build`, `start`, `lint` only
- `docs/FOUNDATIONS-REVIEW.md` (2026-07-05) states it plainly: "No tests of any kind — zero test files, no test config; CI is lint + build only" and names it "the single biggest drag on future velocity"

Do not invent test commands or assume a runner exists. If a phase requires tests, framework selection and setup is itself a task.

## Test Framework

**Runner:** None installed

**Assertion Library:** None

**Run Commands:**
```bash
npm run lint     # ESLint (next lint) — the only automated code check
npm run build    # Next.js production build — catches type errors and build breaks
# There is NO npm test / npm run test
```

## What Verification IS Done

Quality is currently enforced through four mechanisms instead of tests:

**1. CI: lint + build gate (`.github/workflows/ci.yml`)**
- Runs on every PR and push to `main`: `npm ci` → `npm run lint` → `npm run build`
- Build runs with real `NEXT_PUBLIC_*` values from GitHub secrets and placeholder values for server-only vars (`SUPABASE_SERVICE_ROLE_KEY: placeholder`, all-zeros `ENCRYPTION_KEY`)
- TypeScript `strict: true` (`tsconfig.json`) means the build step is an effective type-level regression check
- Branch protection: `main` requires a passing CI check and a PR; direct pushes blocked

**2. Vercel preview deployments**
- Every PR gets a preview URL; changes are manually reviewed on the preview before merge
- Merge to `main` auto-deploys to scansolve.co
- Known caveat (from `docs/FOUNDATIONS-REVIEW.md`): previews currently share prod data — flagged as needing a decision before the first real customer

**3. Manual verification**
- Billing, plan gating, auth, and reporter flows are verified by hand on preview URLs
- `docs/FOUNDATIONS-REVIEW.md`: "Every change to billing, gating, or auth is verified by hand"

**4. Security audits**
- A dated white-hat audit trail exists with a weekly scheduled re-audit (`docs/FOUNDATIONS-REVIEW.md` section 5)
- The `.claude/skills/vibe-security` skill (`.claude/skills/vibe-security/SKILL.md`) codifies the audit checklist: secrets exposure, RLS, auth, rate limiting, payment security, AI integration, input validation

## Runtime Defensive Patterns (compensating for no tests)

The code leans on runtime validation where tests would normally catch regressions:

**Zod schemas on API inputs** — 13 of 24 API routes validate request bodies with Zod (e.g. `CreateIssueSchema` in `app/api/issues/route.ts:63-88` with length caps, numeric regexes, and a signed-URL refinement on `photo_url`)

**Fail-fast env checks** — missing config throws at first use: `lib/crypto.ts:7` (`ENCRYPTION_KEY`), `lib/email.ts:11` (`RESEND_API_KEY`), `lib/push.ts:29` (VAPID keys)

**Error boundaries** — `app/global-error.tsx`, `app/scan/[org_number]/[uid]/error.tsx`, `app/commission/[org_number]/[uid]/error.tsx` catch and log render/data failures per route segment

**Best-effort isolation** — side effects that must not break the main flow are wrapped in never-throw helpers (`notifyOrgOfNewIssue` in `app/api/issues/route.ts:17-61`)

## Test File Organization

Not applicable — no tests exist. No convention has been established for co-located vs. separate test directories.

## Mocking

Not applicable — no mocking framework installed, no patterns established.

## Fixtures and Factories

Not applicable — none exist.

## Coverage

**Requirements:** None enforced. No coverage tooling installed.

## Test Types

**Unit Tests:** Not used
**Integration Tests:** Not used
**E2E Tests:** Not used

## Planned Direction (if adding tests)

`docs/FOUNDATIONS-REVIEW.md` section 5 records the agreed priority — targeted, not blanket coverage:

1. **API-level tests for money/security paths first:** plan gating (`lib/plans.ts`), voucher redemption (`app/api/vouchers/redeem/route.ts`), magic-link auth (`app/api/auth/magic-link/route.ts`), upload authorization (`app/api/upload/route.ts`)
2. **One end-to-end smoke of the reporter flow:** `/scan/[org_number]/[uid]` → `POST /api/issues` → success page
3. **Wire the above into CI** (`.github/workflows/ci.yml`) alongside the existing lint + build gate

Highest-value pure-function targets for unit tests, should they be added: `lib/sanitize.ts` (escapeHtml, safeNextPath, verifyMagicBytes, sanitizeCategory), `lib/rate-limit.ts` (in-memory path), `lib/crypto.ts` (encrypt/decrypt round-trip), `lib/labels.ts` (UID formatting), `lib/plans.ts` (gating logic). All are dependency-light and would need no mocking beyond env vars.

No framework has been chosen. Read `docs/FOUNDATIONS-REVIEW.md` before starting test-foundation work — it carries the dead-end/shortcut ledger and un-park triggers.

## Common Patterns

Not applicable — no async/error testing patterns exist to document.

---

*Testing analysis: 2026-07-05*
