# Codebase Concerns

**Analysis Date:** 2026-07-05

Cross-checked against `docs/FOUNDATIONS-REVIEW.md` (2026-07-05) and the standing security audits in `.security-audits/`. Where this document's counts differ from the review, the numbers here come from direct code inspection.

## Tech Debt

**Untyped org object from `getOrgForUser()`:**
- Issue: `lib/auth.ts:33-56` returns `Record<string, unknown>` (explicit cast at `lib/auth.ts:47`) or an untyped Supabase row. Every consumer re-casts fields by hand.
- Files: 24 `org as Record<string, unknown>` cast sites across 16 files, including `app/api/organizations/route.ts:48-49`, `app/api/vouchers/redeem/route.ts:34`, `app/api/labels/reserve/route.ts:59-60`, `app/api/upload/route.ts:100`, `app/api/invites/route.ts`, `app/dashboard/layout.tsx`, `app/dashboard/settings/page.tsx`. Repo-wide there are 42 `Record<string, unknown>` occurrences and 16 `as unknown as` casts (e.g. `app/api/issues/route.ts:31`, `app/api/invites/route.ts` → `org as unknown as Organization`).
- Impact: Every new org column (Enterprise work adds many) is one typo away from a runtime `undefined` that the compiler would otherwise catch. `types/schema.ts` already has an `Organization` type — it just isn't used as the return type.
- Fix approach: Type `getOrgForUser(): Promise<Organization | null>` and delete the casts. FOUNDATIONS-REVIEW estimates one afternoon; that matches the cast count.

**Role column exists but is never enforced:**
- Issue: `supabase/migrations/003_org_members_invites.sql:6` defines `role IN ('owner','member')`, but no API route checks it. Any member can change the storage backend and credentials (`app/api/organizations/route.ts:53-107` — no role check on PATCH), rename the org, redeem vouchers (`app/api/vouchers/redeem/route.ts`), invite members (`app/api/invites/route.ts`), and upload/change the org logo (`app/api/org/logo/route.ts`).
- Files: `app/api/organizations/route.ts`, `app/api/vouchers/redeem/route.ts`, `app/api/invites/route.ts`, `app/api/org/logo/route.ts`
- Impact: Documented as a parked shortcut (FOUNDATIONS-REVIEW section 3, item 2). Un-park trigger: first pilot with >3 seats or first "who can change settings?" question. Enterprise will ask on day one.
- Fix approach: Extend `getOrgForUser()` to also return the caller's `role`, then gate settings/billing/backend mutations on `role === 'owner'`.

**Sheets/Airtable adapters built but never exercised:**
- Issue: `lib/db/sheets-adapter.ts` (184 lines) and `lib/db/airtable-adapter.ts` (127 lines) are wired through `lib/db/index.ts:getAdapter()`, and the API accepts backend switches (`app/api/organizations/route.ts:21-33` validates `sheets`/`airtable` payloads), but the UI disables them as "Coming soon" (`components/dashboard/BackendSettings.tsx:74-75,110`). They have never run against a real backend.
- Files: `lib/db/sheets-adapter.ts`, `lib/db/airtable-adapter.ts`, `lib/db/index.ts`, `components/dashboard/BackendSettings.tsx`
- Impact: GTM sells "own-data backends" as an Enterprise lever on unproven code. Note the API/UI mismatch: a member can PATCH `backend: "sheets"` directly via `/api/organizations` even though the UI forbids it — the org would silently start routing issue writes through untested code (falls back to Supabase only if adapter init throws, `lib/db/index.ts:39-43`).
- Fix approach: Either block non-Supabase backends server-side until hardened, or budget a hardening pass (see also the Sheets adapter fragility below) when the first Enterprise conversation asks.

**Admin tool is untracked, service-role-powered code:**
- Issue: `admin-tool/` (1,510 lines: `server.js` 1,269 + `lib/create-pilot.js` + `lib/demo-org.js`) holds tier control, voucher creation, org deletion (including `auth.admin.deleteUser`, `server.js:1125,1160`), demo-org and pilot provisioning. `git status` confirms it is untracked — zero history, one laptop failure loses it.
- Files: `admin-tool/server.js`, `admin-tool/lib/create-pilot.js`, `admin-tool/lib/demo-org.js`
- Impact: Operationally load-bearing with no backup. Mitigations present: binds to `127.0.0.1` only (`server.js:1263`), HMAC session auth with timing-safe compare, reads secrets from `../.env.local` rather than containing them.
- Fix approach: Commit it (FOUNDATIONS-REVIEW recommends "now, frankly"). It contains no secrets.

**Manual SQL migrations, no drift detection:**
- Issue: 12 sequential files in `supabase/migrations/` (001–012) applied by hand against the production Supabase project. No migration runner, no applied-migrations table, no rollback scripts.
- Files: `supabase/migrations/001_initial.sql` … `012_push_subscriptions.sql`
- Impact: No way to verify prod schema matches the files; a missed or double-applied migration is invisible. The `issue-photos` bucket is also created manually in the Dashboard (outside migrations entirely).
- Fix approach: Adopt Supabase CLI migrations (`supabase db push` / `supabase migration list`) before schema work accelerates.

**Documentation drift — AI provider and encryption key:**
- Issue: Workspace `CLAUDE.md` says `ANTHROPIC_API_KEY` powers `/api/ai/suggest`; the code uses Google Gemini via `GOOGLE_AI_API_KEY` (`app/api/ai/suggest/route.ts:44`, `app/api/support/chat/route.ts:788`). `@anthropic-ai/sdk` is a dependency with zero imports. `CLAUDE.md` and `.env.local.example` say `ENCRYPTION_KEY` may be "32 random chars or 64-char hex"; `lib/crypto.ts:11` rejects anything except a 64-char hex string. `CLAUDE.md` project-structure section also references `/lib/adapters` and `/hooks`, which don't exist (actual: `lib/db/`, no hooks dir).
- Files: `CLAUDE.md` (workspace), `.env.local.example`, `lib/crypto.ts:5-20`, `package.json`
- Impact: A new contributor (or agent) following the docs sets the wrong env var or key format and hits runtime errors.
- Fix approach: Update both docs; remove the unused dependency (see Dependencies at Risk).

**Empty `scripts/` directory:**
- Issue: `scripts/` exists but is empty.
- Files: `scripts/`
- Impact: Cosmetic; suggests removed tooling.
- Fix approach: Delete or populate.

## Known Bugs

**`reporter_meta.ip_hash` is not a hash:**
- Symptoms: `app/api/issues/route.ts:139-145` comments "Store a short irreversible hash of the IP — not the IP itself", but the code is `Buffer.from(ip).toString("base64").slice(0, 12)`. Base64 is reversible encoding; 12 base64 chars cover 9 bytes — enough to fully recover most IPv4 addresses (e.g. `203.0.113.9` decodes back exactly).
- Files: `app/api/issues/route.ts:141`
- Trigger: Every reporter submission stores this in `reporter_meta`.
- Workaround: None. This contradicts the privacy intent (and the privacy page's no-tracking stance, `app/privacy/page.tsx`) and matters for GDPR since reporter IPs are personal data. Fix: `createHash("sha256").update(ip + salt).digest("hex").slice(0, 12)`.

**`labels/history` shows raw user IDs past 50 users:**
- Symptoms: `app/api/labels/history/route.ts:45` calls `service.auth.admin.listUsers()` with no pagination params — Supabase defaults to 50 per page. Print jobs by any user beyond the first 50 fall back to displaying the raw UUID (`route.ts:62`).
- Files: `app/api/labels/history/route.ts:44-51`
- Trigger: >50 total auth users.
- Workaround: None; cosmetic today at current scale.

**Voucher `use_count` race (parked, confirmed in code):**
- Symptoms: `app/api/vouchers/redeem/route.ts:53` checks `use_count >= max_uses`, then line 83-95 runs three separate writes via `Promise.all` — the comment says "atomically" but this is not a transaction. Two concurrent redemptions both pass the cap check and both write `use_count = n + 1` (a lost update: count advances by 1, not 2). Partial failure can also upgrade the org without recording a redemption, or vice versa.
- Files: `app/api/vouchers/redeem/route.ts:36-100`
- Trigger: Concurrent redemptions of a near-cap multi-use voucher. FOUNDATIONS-REVIEW item 4: un-park at first multi-use public campaign.
- Workaround: Per-user rate limit (5/hour) narrows the window. Fix: a single SQL function/RPC with `UPDATE vouchers SET use_count = use_count + 1 WHERE id = $1 AND use_count < max_uses RETURNING *`.

**Stripe webhook can stomp voucher/comp plans:**
- Symptoms: `app/api/stripe/webhook/route.ts:99-123` — a `customer.subscription.updated` (inactive status) or `subscription.deleted` event calls `setOrgPlan(orgId, "free", "free")` unconditionally, clearing `plan_expires_at` and `plan_source`. An org that cancelled Stripe and then redeemed a voucher (or was comped via the admin tool) gets downgraded to free when the old subscription's final lifecycle event arrives.
- Files: `app/api/stripe/webhook/route.ts:19-44,99-123`
- Trigger: Stripe lifecycle event arriving after a voucher/comp grant on the same org.
- Workaround: Manual re-grant via admin tool. Fix: only downgrade when `plan_source === 'paid'`.

## Security Considerations

**Push subscription SSRF — audited MEDIUM, still unfixed:**
- Risk: `app/api/push/subscribe/route.ts:18` accepts any URL as `endpoint` (`z.string().url().max(1024)`). Every new issue triggers a server-side POST to each stored endpoint via `lib/push.ts` / `notifyOrgOfNewIssue` (`app/api/issues/route.ts:53`). A Prime user can point this at internal addresses (cloud metadata, localhost services).
- Files: `app/api/push/subscribe/route.ts:18`, `lib/push.ts`, `app/api/issues/route.ts:17-61`
- Current mitigation: Requires an authenticated Prime account; web-push sends VAPID-signed encrypted payloads most services reject; dead endpoints are pruned. Flagged in `.security-audits/AUDIT-2026-06-29.md` finding #1 with a ready-made host-allowlist fix — code shows it has not been applied.
- Recommendations: Apply the allowlist (Apple/FCM/Mozilla/WNS push hosts, https only) before the next pilot.

**CSP allows `'unsafe-inline'` scripts (parked):**
- Risk: `middleware.ts:88-90` — production `script-src 'self' 'unsafe-inline'`. Any XSS foothold executes freely; CSP provides no script-injection backstop.
- Files: `middleware.ts:84-115`
- Current mitigation: React's default escaping; no user-generated HTML rendering today. Parked with rationale (FOUNDATIONS-REVIEW item 3); triggers: user-generated HTML, public embeds, or an enterprise security review.
- Recommendations: Move to nonce-based CSP when a trigger fires; Next.js supports nonces via middleware.

**Middleware auth fails open:**
- Risk: `middleware.ts:44-47` — if the Supabase auth check throws, the request is allowed through with only a comment relying on route handlers.
- Files: `middleware.ts:12-47`
- Current mitigation: Verified defense-in-depth: `app/dashboard/layout.tsx:5` calls `requireAuth()` server-side, and API routes independently call `supabase.auth.getUser()`. Fail-open here is acceptable as long as that discipline holds.
- Recommendations: Add a lint rule or test asserting every `/api` route (except public reporter routes) checks auth, since middleware is not the backstop.

**Issue assignment sends email to arbitrary addresses:**
- Risk: `app/api/issues/[id]/route.ts:43-45,70-77` — any org member can PATCH an issue with any syntactically valid `assigned_to` email; the server then emails issue details to that address. No rate limit on this route.
- Files: `app/api/issues/[id]/route.ts`
- Current mitigation: Requires an authenticated member; email content is templated.
- Recommendations: Restrict `assigned_to` to org member emails, or at least rate-limit the route.

**Account-existence disclosure in recovery flow (audited LOW, unfixed):**
- Risk: `app/api/auth/send-to-recovery/route.ts:68-81` — no-account returns `{sent:true}` but account-without-recovery-email returns a 404, letting an attacker distinguish the two states.
- Files: `app/api/auth/send-to-recovery/route.ts`
- Current mitigation: 3 requests/IP/hour rate limit; constant-time delay on some paths.
- Recommendations: Return the same success response for both states (per `.security-audits/AUDIT-2026-06-29.md` finding #2).

**Preview deployments share the production database:**
- Risk: Vercel preview branches run against the production Supabase project (documented in FOUNDATIONS-REVIEW section 2; consistent with the single set of env vars in `.github/workflows/ci.yml` and the secrets table in workspace `CLAUDE.md`). A buggy preview can mutate live customer data with the service-role key.
- Files: deployment configuration (not in repo); `.github/workflows/ci.yml`
- Current mitigation: Solo developer, PR-only deploys, low traffic.
- Recommendations: Second Supabase project for previews, or omit `SUPABASE_SERVICE_ROLE_KEY` from preview env so preview writes fail loudly. FOUNDATIONS-REVIEW marks this "ends at the first real customer".

## Performance Bottlenecks

**Sheets adapter does full-sheet scans on every read:**
- Problem: `lib/db/sheets-adapter.ts:47-60` (`getAllRows`) fetches `A:Z` for the entire sheet on every `getIssuesByOrg`/`getIssueById`, then filters in memory. `updateIssue` (`:141-183`) re-fetches all rows, finds the row index, and writes it back — a read-modify-write race if a concurrent append shifts rows.
- Files: `lib/db/sheets-adapter.ts`
- Cause: Sheets has no query API; acceptable for a prototype, unbounded at scale.
- Improvement path: Cache row index, cap sheet size, or treat Sheets as export-only. Must be addressed in the hardening pass before the adapter ships.

**Reporter response blocks on push fan-out:**
- Problem: `app/api/issues/route.ts:161` `await`s `notifyOrgOfNewIssue` despite the comment "never blocks... the reporter response". It never *fails* the response, but the reporter waits for the org lookup, subscription fetch, rate-limit check, and per-device web-push POSTs.
- Files: `app/api/issues/route.ts:160-162`
- Cause: `await` on best-effort work.
- Improvement path: Use `waitUntil` (Vercel) or fire-and-forget with `.catch()`.

**Gemini calls have no output cap:**
- Problem: `app/api/support/chat/route.ts:830-841` sends no `generationConfig.maxOutputTokens`; response length (and cost) is unbounded per request.
- Files: `app/api/support/chat/route.ts`
- Cause: Omitted config.
- Improvement path: Set `maxOutputTokens`; cost exposure is otherwise bounded only by the 20/IP/hour rate limit.

## Fragile Areas

**Rate limiting silently degrades to per-instance memory:**
- Files: `lib/rate-limit.ts:41-94`
- Why fragile: If `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are absent — or Upstash errors (`:72-74` swallows the failure) — limits fall back to a per-lambda `Map`. On multi-instance serverless, effective limits multiply by instance count; cold starts reset counters. Every abuse control in the app (issues, uploads, recovery, invites, AI) sits on this.
- Safe modification: Confirm Upstash env vars are set in production Vercel; consider logging when the fallback path is taken so degradation is visible.
- Test coverage: None.

**`getOrgForUser()` assumes one org per user:**
- Files: `lib/auth.ts:41-47`
- Why fragile: `.limit(1).single()` on `org_members` picks an arbitrary org if a user ever belongs to two. Every dashboard page and API route resolves org context through this function, so multi-org membership (a plausible Enterprise ask) silently misroutes data. It also uses the service-role key by design (documented bootstrap-deadlock rationale in the comment) — safe today, but any future caller passing an unverified `userId` would bypass RLS.
- Safe modification: Keep `userId` strictly sourced from `requireAuth()`; add an explicit ordering or an active-org concept before multi-org support.
- Test coverage: None.

**`app/api/support/chat/route.ts` — 880-line route with embedded product knowledge:**
- Files: `app/api/support/chat/route.ts`
- Why fragile: The system prompt hardcodes UI copy, pricing, flows, and settings descriptions (~700 lines). Every product change silently invalidates the support bot's answers; there is no link between this prompt and the code it describes. The secret-scrubbing regexes (`:20-40`) are a denylist that must be maintained by hand.
- Safe modification: When changing any user-facing flow, grep this file for the old copy. Longer term, generate the prompt from docs.
- Test coverage: None.

**Public reporter flow is the revenue-critical path with zero tests:**
- Files: `app/api/issues/route.ts`, `app/api/upload/route.ts`, `app/api/scan/[org_number]/[uid]/route.ts`, `lib/locations.ts`, `components/survey/SurveyForm.tsx`
- Why fragile: The scan → survey → submit → photo-upload path is what pilots judge, and it is verified only by hand. The upload route alone has two auth paths (manager vs reporter, `app/api/upload/route.ts:82-125`) whose authorization logic is exactly the kind of thing a refactor breaks silently.
- Safe modification: Manual end-to-end scan test on the Vercel preview before merging anything touching these files.
- Test coverage: Zero — no test files, no test runner config, no test script in `package.json`. CI (`.github/workflows/ci.yml`) is lint + build only.

**Crypto format is positional and unversioned:**
- Files: `lib/crypto.ts:28-42`
- Why fragile: Ciphertext format is `iv:authTag:ciphertext` hex with no version prefix. Any future change to algorithm or key requires a migration of all `organizations.backend_credentials` values with no way to distinguish old from new.
- Safe modification: Prefix a version byte before the format ever needs to change; never rotate `ENCRYPTION_KEY` without a re-encryption script.
- Test coverage: None.

## Scaling Limits

**`auth.admin.listUsers` paging cliffs:**
- Current capacity: 3 call sites (not ~25 as FOUNDATIONS-REVIEW states — verified by grep):
  - `app/api/auth/send-to-recovery/route.ts:52` — `page: 1, perPage: 1000`; silently fails to find users beyond 1,000 (recovery emails stop working for them).
  - `app/api/labels/history/route.ts:45` — no params, default 50; email display degrades past 50 users.
  - `admin-tool/lib/create-pilot.js:19` — `page: 1, perPage: 1000`; pilot provisioning misses existing users past 1,000 (could create duplicates).
- Limit: 50 users (labels history) and 1,000 users (recovery, pilot tool).
- Scaling path: Replace email lookups with a `profiles` table keyed by lowercased email, or loop pages. Cheap now, painful later.

**Supabase free tier (documented, not code-verifiable):**
- Current capacity: FOUNDATIONS-REVIEW section 2 documents free-tier auto-pause guarded by a laptop `launchd` job, limited backups, no PITR, and no restore drill ever run.
- Limit: Project pause on inactivity; unrecoverable data loss window.
- Scaling path: Paid plan at first customer (already decided); run one restore drill before the first pilot.

**Fixed-window rate limiting:**
- Current capacity: Fine for current traffic.
- Limit: `lib/rate-limit.ts:48` fixed windows allow 2× burst at window boundaries; in-memory fallback (above) multiplies limits per instance.
- Scaling path: Sliding-window via Upstash `@upstash/ratelimit` if abuse appears.

## Dependencies at Risk

**Unused dependencies:**
- Risk: `@anthropic-ai/sdk` (^0.95.1) and `pg` (^8.20.0) in `package.json` have zero imports anywhere in `app/`, `lib/`, `components/`, `scripts/`, or `admin-tool/`. `uuid` (^14) is imported only by the never-exercised `lib/db/sheets-adapter.ts`.
- Impact: Install weight, audit surface, and the ANTHROPIC doc-drift confusion noted above.
- Migration plan: Remove `@anthropic-ai/sdk` and `pg`; keep `uuid` only if the Sheets adapter ships.

**ESLint 8 (end-of-life):**
- Risk: `eslint: ^8` is EOL (no security patches); `eslint-config-next` is pinned at 15.1.3 while `next` floats at ^15.5.18.
- Impact: Lint is a CI gate (`.github/workflows/ci.yml`); version skew can cause false passes on new Next.js patterns.
- Migration plan: Move to ESLint 9 flat config with matching `eslint-config-next` when convenient.

## Missing Critical Features

**No tests:**
- Problem: Zero test files, no runner, no config, no `test` script. CI is lint + build only.
- Blocks: Safe iteration on billing (`app/api/stripe/`), plan gating (`lib/plans.ts`), voucher redemption, auth flows, and upload authorization — all currently hand-verified. FOUNDATIONS-REVIEW calls API-level tests on money/security paths "the highest-leverage engineering investment available"; the code supports that assessment.

**No error tracking:**
- Problem: No Sentry or equivalent (verified — no references anywhere). 38 `console.*` calls in `app/`+`lib/` are the entire observability story, visible only in Vercel logs.
- Blocks: Knowing a pilot champion hit an error. A silent production failure during a pilot is a lost deal.

**No product analytics:**
- Problem: No PostHog/Plausible/GA (verified). `app/privacy/page.tsx:83` explicitly promises no tracking scripts — adding analytics requires updating that page and choosing a privacy-light tool (review suggests Plausible).
- Blocks: Measuring scans, activation, funnel, the "Powered by ScanSolve" loop, and which vertical converts.

**Enterprise readiness gaps (documented, confirmed absent in code):**
- Problem: No SAML SSO, no audit logging, no owner/member enforcement (above), no status page. FOUNDATIONS-REVIEW section 3 item 7 adds DPA/data-residency/SOC 2 runway.
- Blocks: Converting successful pilots — procurement asks for these on day one.

## Test Coverage Gaps

Everything, but ranked by risk:

**Plan gating and billing:**
- What's not tested: `getEffectivePlan`/`getPlanLimits` expiry logic (`lib/plans.ts:68-99`), invite caps (`app/api/invites/route.ts:56-83`), Stripe webhook transitions (`app/api/stripe/webhook/route.ts:81-129`), voucher redemption (`app/api/vouchers/redeem/route.ts`).
- Risk: Silent revenue leaks or wrongful downgrades (see the plan-stomping bug above — a test would have caught it).
- Priority: High

**Upload authorization (dual-path):**
- What's not tested: `app/api/upload/route.ts:82-125` manager-vs-reporter org resolution, magic-byte verification (`lib/sanitize.ts`), signed-URL constraint on `photo_url` (`app/api/issues/route.ts:69-86`).
- Risk: Cross-org storage writes or arbitrary-URL injection if a refactor loosens a check.
- Priority: High

**Reporter submission flow (end-to-end):**
- What's not tested: scan lookup → category validation → adapter write → success message (`app/api/issues/route.ts`, `lib/locations.ts`).
- Risk: The core product breaking unnoticed between manual checks.
- Priority: High

**Auth and recovery flows:**
- What's not tested: magic-link generation (`app/api/auth/magic-link/route.ts`), recovery (`app/api/auth/send-to-recovery/route.ts`), invite acceptance (`app/api/invites/[token]/`), `getOrgForUser` fallback logic (`lib/auth.ts`).
- Risk: Lockouts or auth bypass regressions.
- Priority: Medium

**Crypto round-trip:**
- What's not tested: `lib/crypto.ts` encrypt/decrypt, key-format rejection.
- Risk: A format change bricking all stored backend credentials.
- Priority: Medium

---

*Concerns audit: 2026-07-05*
