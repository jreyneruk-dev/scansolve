# ScanSolve foundations review

Date: 2026-07-05. A step-back review before the Enterprise push: system quality,
future readiness, the marketing approach, and how well the documentation and
development practice will carry heavier work. This is an assessment and a prep
plan, not a fix list. Companion docs: `GTM-STRATEGY.md`, `PILOT-TOOLING-PLAN.md`.

## 1. How the market sees this category

Research findings (July 2026), with the sources at the bottom of this section.

The category ScanSolve sits in is CMMS / maintenance-request software, and the
incumbents are strong: MaintainX (free tier, then $16–49 per user per month),
UpKeep ($20–75 per user per month), Limble (~$40 per user per month). Typical
SMB spend is $500–2,000 per month for a 10–30 person team. Three implications:

- Per-user pricing is the incumbent model. ScanSolve Prime at £15 per org
  (owner + 20 members) is roughly 20–50× cheaper than an incumbent for the same
  team. That is either the sharpest wedge in the deck ("no per-seat tax") or a
  serious under-capture on multi-site orgs. It is currently neither stated in
  the GTM doc nor used in any copy. Decide which it is and say it loudly.
- "No app, no login QR reporting" is not a moat on its own. SafetyCulture
  ships no-login issue QR codes as a feature; Oxmaint sells QR scan-to-work-order
  for hotels. The honest differentiation is the combination: radical simplicity,
  flat price, unlimited labels, and zero setup for reporters. Position against
  the incumbents' complexity and per-seat cost, not on the QR mechanic.
- Enterprise procurement gates are real. The baseline buyers ask for: SOC 2
  Type II (or ISO 27001), SAML SSO, MFA, audit logging, pen-test reports, and a
  DPA. The micro-pilot strategy (bypass IT, standalone web tool) is the correct
  and only viable entry today — but every pilot that succeeds will hit this wall
  at conversion. That wall needs a funded runway, not a surprise.

Sources: [Limble CMMS comparison](https://limble.com/learn/cmms/software-comparison/),
[Limble cost guide](https://limble.com/learn/cost),
[MaintainX vs UpKeep](https://limble.com/learn/maintainx-vs-upkeep),
[Facilio CMMS pricing guide](https://facilio.com/blog/cmms-pricing/),
[SafetyCulture issue QR codes](https://help.safetyculture.com/en-US/001617/),
[Oxmaint hotel QR maintenance](https://oxmaint.com/industries/hospitality/hotel-qr-code-maintenance-system-scan-report-resolve),
[SOC 2 vendor management guide](https://www.atlassystems.com/blog/soc-2-vendor-management),
[SOC 2 customer questionnaires](https://www.konfirmity.com/blog/soc-2-customer-security-questionnaire).

## 2. System quality — what is solid, what is brittle

The app is ~13,700 lines of TypeScript across 29 dependencies on Next.js 15.
For a founder-built pre-revenue product the architecture is genuinely good:
clean route/lib/component separation, a real adapter interface for the data
layer, RLS plus service-role discipline that has survived a white-hat audit,
PR-only deploys with branch protection and CI, and encrypted third-party
credentials. Nothing here is a rewrite candidate.

The brittleness is in what is absent, not what is badly built:

| Gap | Evidence | Why it matters |
|---|---|---|
| No tests of any kind | Zero test files, no test config; CI is lint + build only | Every change to billing, gating, or auth is verified by hand. This is the single biggest drag on future velocity — Enterprise work multiplies the paths nobody re-checks. |
| No error tracking | No Sentry or equivalent anywhere | Production failures are invisible unless a user emails. A pilot champion hitting an error is a silent lost deal. |
| No product analytics | No PostHog/Plausible/GA anywhere | You cannot see scans, activation, funnel, or which vertical converts. This is also the root of the "incremental marketing" feeling — there is no measurement loop to iterate against. |
| Untyped org object | `getOrgForUser()` returns an untyped record; 24 `Record<string, unknown>` casts and 16 `as unknown as` at call sites | Every new org field (and Enterprise adds many) is one typo away from a runtime bug the compiler could have caught. One afternoon to fix properly. |
| `listUsers` scans | 25 call sites page through users (limit 1000) to find one by email | Quietly breaks past 1,000 users. Fine today; a known cliff. |
| Preview = prod DB | Vercel previews point at the production Supabase | A buggy preview branch can mutate live customer data. Acceptable pre-customer; not during pilots. |
| Rate limiting fallback | In-memory per-instance when Upstash is absent | Weak under multi-instance serverless; enable Upstash in prod and confirm. |
| Manual migrations | 12 SQL files applied by hand against prod | No drift detection, no rollback story. |
| Supabase free tier | Auto-pause guarded by a laptop launchd job; limited backups, no PITR | Already decided: paid plan at first customer. The backup/restore gap is the part not yet acknowledged — there has been no restore drill. |

## 3. Future-readiness — dead-ends and shortcuts ledger

Deliberate shortcuts, each with the trigger that should un-park it. None are
active problems; all become problems on a predictable event.

1. Sheets/Airtable adapters: built (~450 lines) but UI says "coming soon" and
   they have never run against a real backend. The GTM sells "own-data backends"
   as an Enterprise lever. Trigger: first Enterprise conversation that asks;
   budget a hardening pass then, or cut the promise from the tier.
2. Owner-vs-member roles: any member can change backends, redeem vouchers,
   rename the org. Trigger: first pilot with more than ~3 seats, or the first
   customer who asks "who can change settings?". Enterprise will ask on day one.
3. Nonce-based CSP: parked with rationale (see security backlog). Trigger:
   richer user-generated HTML, a public embed, or an enterprise security review.
4. Voucher use-count race: low impact. Trigger: first multi-use public campaign.
5. Admin tool is untracked local code. It now holds real operational value
   (tier control, vouchers, demo org, pilot provisioning) with service-role
   power and zero git history — one laptop failure loses it. Trigger: now,
   frankly. Recommendation: commit it to the repo (it reads secrets from
   `.env.local` and contains none) or a private repo.
6. Machine-local planning state. The master plan file (including the parked
   security backlog) lives in `~/.claude/plans/` on one laptop, outside the
   repo. Same single-point-of-failure as the admin tool. Recommendation: fold
   the security backlog into `docs/SECURITY-BACKLOG.md` so it survives.
7. Enterprise readiness items that do not exist yet and are slow to acquire:
   SAML SSO, audit logging, DPA template + data-residency answer (which region
   is the Supabase project in?), status page, pen test, SOC 2 runway (typically
   6–12 months to Type II). None block pilots. All block conversions. The GTM
   should carry a dated "compliance runway" decision point: when the first
   pilot signals conversion intent, start the clock.

## 4. Marketing — why it feels incremental, and what would not be

What exists is good execution of an inside-out plan: personas, hooks, pilot
blueprint, brand voice, outreach templates. What is missing is the outside-in
half, which is where step-change (rather than incremental) growth decisions live:

- No competitive frame. The GTM doc never names a competitor. Without
  "ScanSolve vs MaintainX/UpKeep/SafetyCulture" positioning, every pitch
  re-argues the category from scratch and the pricing story ("free vs $16–75
  per user per month") — the most striking fact available — goes unused.
- No measurement loop. Zero telemetry means outreach learnings are anecdotes.
  Before the next outreach wave, instrument the funnel (privacy-light analytics:
  Plausible is the low-friction fit for a GDPR-sensitive reporter page) so
  vertical/hook performance is data, not memory.
- Pricing is asserted, not tested. £15 flat was chosen internally. The
  research suggests the flat-vs-per-seat contrast is the wedge; it also suggests
  Enterprise pricing should anchor against incumbent per-user spend (a 20-seat
  UpKeep deployment is ~$10k+/year — "price on application" should know that).
- One channel, one founder. Everything routes through manual founder outreach.
  Correct at this stage — but the plan has no stated graduation criteria. Add
  them: e.g. after N pilots or first paid conversion, un-defer the content/SEO
  engine with the case-study as its seed.
- The distribution thesis is untested. "Labels on walls are the moat" predicts
  reporter-side scans convert into new org signups. Nothing measures scan → 
  "what is this?" → signup. The reporter page's "Powered by ScanSolve" link is
  the loop; instrument it.

None of this says change strategy. It says: add the competitive/pricing frame,
add measurement, and pre-commit the triggers that turn pilots into a repeatable
motion. That is the difference between incremental and compounding.

## 5. Documentation and development practice

What is working and should be kept exactly as-is: the two standing docs with
decision logs and a maintenance rule; CLAUDE.md as the always-loaded pointer;
PR-only deploys with CI and branch protection; the dated white-hat audit trail
and the weekly scheduled re-audit.

What a slick Enterprise phase needs added, in order of value:

1. A test foundation and CI gate. Not blanket coverage — API-level tests for
   the money/security paths (plan gating, voucher redemption, magic-link,
   upload authorization) plus one end-to-end smoke of the reporter flow, run in
   CI. This is the highest-leverage engineering investment available.
2. Error tracking + uptime. Sentry (or similar) and a simple status/uptime
   check, before the first pilot goes live. A pilot that fails silently is
   worse than no pilot.
3. Analytics. As above — one privacy-light tool, wired to the funnel and the
   scan loop.
4. ADRs. Significant decisions currently live in chat history and a
   machine-local plan file. A `docs/adr/` folder with one-page records (the
   backend-adapter choice, the no-per-seat pricing decision, the comp/voucher
   model) makes future sessions and future collaborators fast.
5. Runbook. One page: Supabase down, Resend down, Stripe webhook failing,
   restore-from-backup steps (and actually run a restore drill once).
6. Environments decision. Previews sharing prod data ends at the first real
   customer: either a second Supabase project for previews or disable preview
   DB writes.
7. Data model doc. A generated ERD + one paragraph per table; cheap now,
   valuable the moment anyone else (human or agent) touches the schema.

## 6. Recommended audit programme

Highest value first; the first four are runnable here with existing skills.

| Audit | Tool/skill | What it answers |
|---|---|---|
| Codebase map | `gsd-map-codebase` (parallel mapper agents → `.planning/codebase/`) | A durable tech/architecture/quality/concerns map that outlives this session — direct prep for Enterprise work |
| Architecture pathfinding | `pathfinder` | Duplicated concerns and the unified shape before new feature weight lands |
| Over-engineering pass | `ponytail-audit` | What to delete/simplify before building more |
| SEO / discoverability | `seo` audit of scansolve.co | The "how others see this" question for the inbound channel; health score + prioritized fixes |
| Accessibility pass | manual + Lighthouse | Reporter page and posters are public-facing; WCAG also appears in enterprise questionnaires |
| Restore drill | manual, Supabase dashboard | Whether the backup story survives contact with reality |
| GDPR/DPA review | human/legal task | Reporter photos can contain personal data; UK enterprise will ask for a DPA and data-residency answer |
| Pen test / SOC 2 scoping | external vendor, later | Price the compliance runway before an Enterprise deal forces it |

Suggested two-day order: codebase map + SEO audit (parallel, ~an hour of agent
time), then pathfinder + ponytail-audit on the results, then fold everything
into this doc and the GTM decision log. The restore drill and analytics
decision fit in the gaps. Legal/pen-test items are scheduled, not done, in two
days.

## Decision log

- 2026-07-05: review written. Key calls surfaced for decision: state the
  flat-vs-per-seat pricing position; fund a compliance runway trigger; commit
  the admin tool to git; move the security backlog into the repo; instrument
  analytics before the next outreach wave; add the test/error-tracking floor
  before the first live pilot.
