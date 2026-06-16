# Enterprise pilot tooling — build plan

Last updated: 2026-06-16

Companion to `GTM-STRATEGY.md`. That document covers who we sell to and why; this one
covers what to build to run the champion-led micro-pilots, in what order. Keep both in
sync: when the build plan changes, update here and add a line to the GTM decision log if
the change affects strategy.

## Scope

The micro-pilot needs three things the product does not have yet:

1. A demo or sandbox org to screen-share on the first 15-minute call.
2. Printable "scan to report an issue" posters or table tents to place by the codes.
3. A pilot scorecard to review the agreed success metrics at day 30.

A founder-run provisioning console makes pilots repeatable, but it is not required for
the first pilot, which can be set up by hand. Of the above, only the poster and the
scorecard are net-new customer-facing code; the demo org is seed data and the console is
internal tooling.

## What already exists (do not rebuild)

| Capability | Where |
|---|---|
| Label geometry and UID format | `lib/labels.ts` (`SHEET_TYPES`, `formatUID`) |
| QR rendering | `qrcode` npm package, used by `LabelSheet` and `PrintPreviewModal` |
| Browser-print label sheets | `app/dashboard/labels/page.tsx` plus the print builder |
| Label reservation | `app/api/labels/reserve/route.ts` |
| comp Prime grant with expiry | `organizations.plan` + `plan_source='comp'` + `plan_expires_at`, surfaced in the admin tool |
| Plan gating | `lib/plans.ts` |
| Reporter flow and issue capture | `/scan/[org_number]/[uid]`, `issues` table (`created_at`, `resolved_at`, `location_id`, `org_id`) |
| Magic-link sign-in | `app/api/auth/magic-link/route.ts` |
| Internal admin (service role) | `admin-tool/server.js` (port 3002) |

## Build order

MVP-first: demo org, then poster and scorecard, then the console. Rationale: you need a
demo for the first calls, then the means to run and review one pilot by hand, and only
then the tooling to make pilots repeatable.

### Phase 0 (prerequisite): ship the parked security fixes

The white-hat audit fixes are applied to the working tree but unmerged. Land them through
the normal branch / PR / CI flow first, so this new work branches off a clean main rather
than stacking on top of unreviewed security changes. See the GTM open items.

### Phase 1: demo / sandbox org

A pre-seeded org with vertical-flavoured sample data the founder can screen-share: a few
locations named like real assets (reception, an HVAC unit, a coffee machine) and a
handful of issues across statuses (reported, assigned, resolved) so the dashboard looks
alive.

- Approach: a seed action that creates the org as comp Prime (ad-free, brandable), its
  locations, and sample issues. Simplest home is a new action in `admin-tool/server.js`
  ("create demo org"); a Supabase SQL seed is the alternative.
- Verify: open `/dashboard` for the demo org via a magic link and confirm the seeded
  issues render; open `/scan/{org_number}/{uid}` for a demo location and confirm the
  reporter form loads.

### Phase 2a: "scan to report" poster generator

A single-QR, large-format printable per location (or a generic per-org version): a clear
headline, one line of instruction, a large QR, and the org logo if set.

- Approach: mirror the existing print path rather than adding a server PDF dependency.
  Reuse `qrcode` rendering and the print-CSS approach already used by the label print
  builder. Add a print route or page (for example `app/print/poster/[org_number]/[uid]`)
  laid out for A4 or A5, printed to PDF with the browser. Link it from
  `app/dashboard/labels/page.tsx`.
- Verify: the printed QR resolves to `/scan/{org_number}/{uid}` and scans cleanly from a
  phone at arm's length.

### Phase 2b: pilot scorecard

The day-30 review numbers: count of reports captured via QR, and end-to-end resolution
time (`resolved_at` minus `created_at`) per tagged location, shown against the targets
agreed at the start.

- Approach: a dashboard page (for example `app/dashboard/scorecard`) or a card that
  queries `issues` for the org over a date range, grouped by location, computing count
  and median or average resolution time. Optional CSV export for sharing in the meeting.
- Data: all required fields already exist on `issues`; no migration needed.
- Verify: run it against the Phase 1 demo org and confirm the figures match a hand
  calculation from the seeded rows.

### Phase 3: provisioning console MVP (founder-run, optional for pilot #1)

A single "new pilot" screen in the admin tool that assembles a pilot kit in one pass.

- Approach: extend `admin-tool/server.js`. Inputs: org name, logo, asset class, and
  number of labels. It creates the org as comp Prime with `plan_expires_at` set to 30
  days out, bulk-creates that many locations and UIDs (reusing `formatUID` and the
  reserve logic), assigns a survey template, and returns a magic link plus links to the
  poster and the scorecard.
- Gap versus today: bulk location and label creation, and the single-screen UI. The data
  model already supports everything underneath.
- Verify: one submission yields a working pilot org reachable by magic link with the
  requested number of scannable labels and a populated scorecard.

## Open questions to confirm at build time

- Survey templates: is there a reusable template, or is `survey_config` only ever set
  per location? Check the commission and locations code before Phase 3.
- Logo upload: confirm the org branding field and its render path are built end to end
  (the Prime own-logo feature was planned; verify it shipped) before relying on it in
  Phases 1 and 3.
- Poster format: A4 single, A5 pair, or a folded table tent. Decide during Phase 2a.

## Deployment

App changes follow the CLAUDE.md workflow: a branch per change, a PR, CI (lint plus
build), a Vercel preview, then merge. Admin-tool changes are local-only and are not
deployed.
