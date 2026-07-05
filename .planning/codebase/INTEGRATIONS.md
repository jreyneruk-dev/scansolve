# External Integrations

**Analysis Date:** 2026-07-05

## APIs & External Services

**Payments — Stripe:**
- Prime subscription checkout and lifecycle
  - SDK/Client: `stripe` `^22.2.0`, API version pinned to `2026-05-27.dahlia`
  - Checkout: `app/api/stripe/checkout/route.ts` - Creates a subscription-mode Checkout Session using `STRIPE_PRICE_ID`; org/user IDs carried in session and subscription metadata
  - Webhook: `app/api/stripe/webhook/route.ts` - Handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`; updates `organizations.plan`, `plan_source`, `stripe_customer_id`, `stripe_subscription_id` (columns from `supabase/migrations/010_stripe_columns.sql`)
  - Auth: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (signature verification is a hard requirement in production; dev-only bypass exists for `stripe trigger`)

**Email — Resend:**
- All transactional email: issue assignment, invites, recovery codes, magic links, status updates (`lib/email.ts` exports `sendIssueAssignmentEmail`, `sendInviteEmail`, `sendRecoveryCodeEmail`, `sendMagicLinkEmail`, `sendStatusUpdateEmail`); support contact form at `app/api/support/email/route.ts`
  - SDK/Client: `resend` `^4.0.1`
  - Auth: `RESEND_API_KEY`, sender configured via `FROM_EMAIL` (rendered as `ScanSolve <address>`)
  - Errors: `lib/email.ts:sendEmail()` converts Resend's `{ data, error }` return into a thrown error so failed sends surface to callers

**AI — Google Gemini (two integration paths):**
- Category suggestions: `app/api/ai/suggest/route.ts` - `@google/generative-ai` SDK, model `gemini-2.5-flash`; auth-required, rate-limited (20/user/hour), 24h in-process cache per room name
- Support chat widget: `app/api/support/chat/route.ts` - Raw REST `fetch` to `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`; large embedded knowledge-base system prompt; output filtered against credential-leak regexes; input capped at 1000 chars
  - Auth (both): `GOOGLE_AI_API_KEY` read via `lib/server-env.ts:getServerEnv()`
- Note: `@anthropic-ai/sdk` is installed but unused — no Anthropic API calls exist in the codebase; `ANTHROPIC_API_KEY` is not read anywhere

**Ads — Google AdSense:**
- Revenue ads on free-tier reporter pages
  - Loader: `app/layout.tsx` - `adsbygoogle.js` script; publisher ID `ca-pub-7948132881222311` hardcoded (intentional, for site verification)
  - Ad unit: `components/ui/ReporterAd.tsx` - Renders a real ad when `NEXT_PUBLIC_ADSENSE_SLOT` is set, house-ad fallback otherwise
  - Plan gating: ads shown only when `lib/plans.ts:getPlanLimits().hasAds` is true (free/Starter tier)

**Web Push — VAPID (no third-party account):**
- Instant issue alerts for Prime managers, delivered via browser vendor push services (FCM/APNs/Mozilla)
  - Server: `lib/push.ts` - `web-push` library; `sendPush()` returns `gone: true` on 404/410 so callers delete dead subscriptions
  - Service worker: `public/sw.js` - Push display + notification click handling only (no offline caching)
  - Routes: `app/api/push/subscribe/route.ts`, `app/api/push/unsubscribe/route.ts` (zod-validated)
  - Storage: `push_subscriptions` table (`supabase/migrations/012_push_subscriptions.sql`)
  - Auth: `VAPID_PUBLIC_KEY` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (same value), `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

## Data Storage

**Databases:**
- Supabase Postgres (primary, default backend)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (reads under RLS) / `SUPABASE_SERVICE_ROLE_KEY` (server-only writes, RLS bypass)
  - Client: `@supabase/supabase-js` + `@supabase/ssr`; no ORM
  - Tables (from `supabase/migrations/`): `organizations`, `locations`, `issues`, `org_members`, `org_invites`, `uid_sequence`, `label_print_jobs`, `banned_emails`, `vouchers`, `voucher_redemptions`, `push_subscriptions`
- Pluggable per-org issue backends via the adapter pattern (`lib/db/adapter.ts:IDataAdapter`, selected by `lib/db/index.ts:getAdapter(orgId)`):
  - **Google Sheets** - `lib/db/sheets-adapter.ts` - `googleapis` with a per-org service-account key, scope `spreadsheets`; issues stored in an "Issues" sheet
  - **Airtable** - `lib/db/airtable-adapter.ts` - Raw REST `fetch` to `https://api.airtable.com/v0/{baseId}` with a per-org API key; "Issues" table
  - Per-org credentials are AES-256-GCM encrypted (`lib/crypto.ts`, key: `ENCRYPTION_KEY`, 64-char hex enforced) in `organizations.backend_credentials` (`supabase/migrations/002_backend_credentials.sql`); decrypted only during server-side adapter construction; any adapter failure falls back to `SupabaseAdapter`

**File Storage:**
- Supabase Storage
  - `issue-photos` bucket (created manually in the Supabase Dashboard) - `lib/storage.ts` uploads via service role, serves 1-year signed URLs, `refreshPhotoUrl()` re-signs expired URLs; org logos use 10-year signed URLs
  - Upload route: `app/api/upload/route.ts` - 5 MB cap, IP rate-limited (10/10min)
  - `next.config.ts` allows `*.supabase.co/storage/v1/object/sign/**` as an image remote pattern

**Caching:**
- Upstash Redis (optional) - `lib/rate-limit.ts` - Fixed-window rate limiting via the Upstash REST API (raw `fetch`, no SDK); requires `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`; falls back to an in-memory `Map` per warm serverless instance when unset or unreachable
- In-process `Map` cache for AI category suggestions (`app/api/ai/suggest/route.ts`, 24h TTL)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (managers/Super Users only)
  - Magic link + 8-digit OTP code sign-in; PKCE flow (`lib/supabase/client.ts`); custom magic-link/recovery flows at `app/api/auth/magic-link/route.ts`, `app/api/auth/check-email/route.ts`, `app/api/auth/send-to-recovery/route.ts`; callback at `app/auth/callback/`
  - Session refresh + route protection for `/dashboard` and `/onboarding` in `middleware.ts`
  - Server helpers: `lib/auth.ts` - `requireAuth()`, `getOptionalUser()`, `getOrgForUser()` (checks `org_members`, falls back to `organizations.owner_id`)
- Reporters: no login. Public API routes (`app/api/issues/route.ts`, `app/api/scan/[org_number]/[uid]/route.ts`, `app/api/upload/route.ts`) write via the service role key server-side; the anon key is never used for writes
- Admin tool: `admin-tool/server.js` - Own username/password login (`ADMIN_USERNAME`/`ADMIN_PASSWORD` in `.env.local`), HMAC-signed session cookie regenerated per restart, binds to `127.0.0.1:3001` only; uses the Supabase service role key directly

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry or equivalent detected)

**Logs:**
- `console.error`/`console.warn` with bracketed route prefixes (e.g. `[stripe/webhook]`, `[push]`, `[AI suggest]`); Vercel function logs in production

## CI/CD & Deployment

**Hosting:**
- Vercel (scansolve.co); www→apex redirect in `next.config.ts`; preview deploys per PR, auto-deploy to production on merge to `main`
- Admin tool is local-only, never deployed

**CI Pipeline:**
- GitHub Actions - `.github/workflows/ci.yml` - `npm run lint` + `npm run build` on PRs and pushes to `main`; branch protection requires passing CI + PR

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (embedded in QR payloads)
- `ENCRYPTION_KEY` (64-char hex, AES-256-GCM)
- `RESEND_API_KEY`, `FROM_EMAIL`
- `GOOGLE_AI_API_KEY` (AI suggest + support chat; routes return 503/fallback when unset)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`
- `VAPID_PUBLIC_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

**Optional env vars:**
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (distributed rate limiting)
- `NEXT_PUBLIC_ADSENSE_SLOT` (real AdSense unit; house ad otherwise)
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_PORT` (admin tool only)

**Secrets location:**
- Local: `.env.local` (gitignored); templates in `.env.local.example`
- Production: Vercel env vars (server-only secrets live only there); `NEXT_PUBLIC_*` vars duplicated as GitHub Actions secrets for CI builds

## Webhooks & Callbacks

**Incoming:**
- `app/api/stripe/webhook/route.ts` - Stripe events, signature-verified with `STRIPE_WEBHOOK_SECRET` (verification mandatory in production)
- `app/auth/callback/` - Supabase auth redirect callback

**Outgoing:**
- Web Push messages to browser vendor push endpoints (FCM/APNs/Mozilla) via `lib/push.ts` — VAPID-authenticated, not a traditional webhook
- None otherwise

---

*Integration audit: 2026-07-05*
