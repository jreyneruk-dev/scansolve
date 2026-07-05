# Technology Stack

**Analysis Date:** 2026-07-05

## Languages

**Primary:**
- TypeScript 5 (strict mode) - All application code: `app/`, `lib/`, `components/`, `middleware.ts`, `types/schema.ts`

**Secondary:**
- JavaScript (CommonJS) - `admin-tool/server.js` (local admin server) and `public/sw.js` (service worker for Web Push)
- SQL (Postgres dialect) - `supabase/migrations/001_initial.sql` through `012_push_subscriptions.sql`

## Runtime

**Environment:**
- Node.js 20 (pinned in CI: `.github/workflows/ci.yml` uses `node-version: 20`; `@types/node: ^20`)
- Production runs on Vercel serverless (rate limiter comments in `lib/rate-limit.ts` assume warm-lambda semantics)
- Edge runtime for `middleware.ts` (Next.js middleware)

**Package Manager:**
- npm
- Lockfile: present (`package-lock.json` in root; `admin-tool/package-lock.json` for the admin tool)

## Frameworks

**Core:**
- Next.js `^15.5.18` (App Router) - Full-stack framework; all pages under `app/`, API routes under `app/api/*/route.ts`
- React `^19.0.0` / React DOM `^19.0.0` - UI
- Tailwind CSS `^3.4.1` + `tailwindcss-animate` - Styling (`tailwind.config.ts`, `postcss.config.js`)
- Radix UI primitives (`@radix-ui/react-dialog`, `-dropdown-menu`, `-label`, `-select`, `-separator`, `-slot`, `-toast`) - Headless UI components, composed in `components/ui/`

**Testing:**
- Not detected. No test framework, no test files, no test script in `package.json`.

**Build/Dev:**
- ESLint 8 with `eslint-config-next` 15.1.3 - Config: `.eslintrc.json` (extends `next/core-web-vitals`, `next/typescript`; unused vars must be `_`-prefixed)
- TypeScript compiler (noEmit; Next.js handles builds)
- Scripts: `npm run dev` / `build` / `start` / `lint` (no test script)

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` `^2.46.2` - Postgres/Auth/Storage client; service-role clients created in `lib/auth.ts`, `lib/storage.ts`, `lib/db/index.ts`
- `@supabase/ssr` `^0.5.2` - Cookie-based SSR auth clients (`lib/supabase/client.ts`, `lib/supabase/server.ts`, `middleware.ts`); PKCE flow
- `stripe` `^22.2.0` - Subscription billing (`app/api/stripe/checkout/route.ts`, `app/api/stripe/webhook/route.ts`); pinned API version `2026-05-27.dahlia`
- `resend` `^4.0.1` - Transactional email (`lib/email.ts`)
- `@google/generative-ai` `^0.24.1` - Gemini SDK for AI category suggestions (`app/api/ai/suggest/route.ts`, model `gemini-2.5-flash`)
- `googleapis` `^171.4.0` - Google Sheets API for the Sheets data adapter (`lib/db/sheets-adapter.ts`)
- `web-push` `^3.6.7` - VAPID Web Push delivery (`lib/push.ts`)
- `zod` `^3.24.1` - Request body validation across API routes (e.g. `app/api/issues/route.ts`, `app/api/invites/route.ts`, `app/api/push/subscribe/route.ts`)
- `qrcode` `^1.5.4` - Client-side QR generation (`components/labels/LabelSheet.tsx`, `components/labels/PrintPreviewModal.tsx`, `components/posters/PosterPreviewModal.tsx`)

**Infrastructure:**
- `lucide-react` `^0.468.0` - Icons (project convention: lucide-react only, no inline SVGs)
- `uuid` `^14.0.0` - ID generation (used in `lib/db/sheets-adapter.ts`)
- `clsx`, `tailwind-merge`, `class-variance-authority` - className composition utilities (`lib/utils.ts`)
- Node built-in `crypto` - AES-256-GCM credential encryption (`lib/crypto.ts`)

**Declared but unused (candidates for removal):**
- `@anthropic-ai/sdk` `^0.95.1` - No imports anywhere; AI features use Gemini instead. `ANTHROPIC_API_KEY` is not referenced in code (only in docs/env examples).
- `pg` `^8.20.0` - No imports anywhere; all Postgres access goes through the Supabase client.

**admin-tool dependencies (`admin-tool/package.json`):**
- `@supabase/supabase-js` `^2.49.4`, `cookie` `^0.7.2`, `dotenv` `^16.5.0` - Zero-framework Node HTTP server (`admin-tool/server.js`)

## Configuration

**Environment:**
- Local dev: `.env.local` (gitignored), template at `.env.local.example` (an older `.env.example` and a `.env.txt` also exist in the repo root — existence noted only)
- `lib/server-env.ts:getServerEnv()` - Reads server secrets from `process.env` with a direct `.env.local` file-read fallback for dev (used for `GOOGLE_AI_API_KEY`)
- Production: Vercel environment variables; CI build uses GitHub Actions secrets plus dummy placeholders for server-only vars
- Key required vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `ENCRYPTION_KEY` (64-char hex, enforced in `lib/crypto.ts`), `RESEND_API_KEY`, `FROM_EMAIL` (full list in INTEGRATIONS.md)

**Build:**
- `next.config.ts` - `poweredByHeader: false`, www→apex redirect for scansolve.co, Supabase signed-URL image remote pattern
- `tsconfig.json` - `strict: true`, path alias `@/*` → repo root, target ES2017, bundler module resolution
- `tailwind.config.ts`, `postcss.config.js` - Styling pipeline
- `middleware.ts` - Session refresh, auth gate on `/dashboard` and `/onboarding`, security headers (HSTS, X-Content-Type-Options, framing, CSP)

## Platform Requirements

**Development:**
- Node.js 20+, npm; `.env.local` populated from `.env.local.example`; Supabase project with migrations from `supabase/migrations/` applied in order; `issue-photos` storage bucket created manually
- Admin tool runs separately: `cd admin-tool && npm start` → `127.0.0.1:3001` (local only, never deployed; reads `../.env.local` via dotenv)

**Production:**
- Vercel (scansolve.co) — `.vercel/` directory present; deploys via PR merge to `main` only (direct pushes and CLI `vercel --prod` prohibited per project workflow)
- CI: GitHub Actions (`.github/workflows/ci.yml`) runs `npm run lint` + `npm run build` on every PR and push to `main`; both required to merge
- PWA assets: `public/manifest.json` (standalone display, `/dashboard` start URL) and `public/sw.js` (push-only service worker, no offline caching)

## Project Skills

- `.claude/skills/vibe-security/` - Security audit skill (`SKILL.md` + `references/`). Triggers on security-related work; audit process covers secrets, Supabase RLS, auth, rate limiting, payments, AI integration, and deployment config. Prior audit output lives in `.security-audits/`.

---

*Stack analysis: 2026-07-05*
