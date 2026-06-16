# ScanSolve go-to-market strategy

Last updated: 2026-06-16

This is the standing reference for how ScanSolve goes to market: who we sell to, the
message that lands, how we run pilots, and the pricing model. It also keeps a dated
record of the decisions behind the current plan so the reasoning survives across
sessions.

## Maintaining this document

Treat this as a living document, not a one-time write-up. Whenever a go-to-market
decision changes (ICP, positioning, a hook, pilot mechanics, pricing, or the build
work that supports any of these):

1. Update the relevant section so the top of the document always reflects current intent.
2. Add a dated line to "Decision log" at the bottom saying what changed and why.
3. Update the "Last updated" date.

The deeper technical, deployment, and security plans live elsewhere (see "Related
plans"); this document covers go-to-market only.

## Current strategy: champion-led enterprise pilots

The earlier plan targeted a single vertical (gyms and leisure) and sold to the
owner-operator. The current strategy targets a job function instead of a vertical: the
person inside an organisation who owns the gap between a problem being spotted and
fixed. That function recurs across offices, hospitals, universities, shopping centres,
manufacturing, multi-site retail, and property and facilities-management firms, which
is why the addressable market is larger.

Gyms are not dropped. They stay as the fast-cash and testimonial beachhead while the
enterprise motion is seeded through LinkedIn. Gyms prove the product works; enterprise
is the larger bet.

### Who to target

Aim at the Director or Regional Manager level, not the C-suite and not the ground-level
technician. A COO ignores the email or forwards it down. A technician likes the idea
but has no budget or authority. The Director or Regional Manager is judged on
efficiency, time-to-resolution, and data accuracy, and usually holds discretionary
budget for a pilot.

### Personas and hooks by vertical

The message is not one-size. Each vertical has a different buyer and a different hook,
and each hook leans on a different part of the product.

| Vertical | Target role | Hook |
|---|---|---|
| Tech / workplace | Regional Facilities Manager, Director of Workplace Experience | Speed and zero friction. A passing employee scans and logs a fault in seconds, no intranet login, so the team fixes issues before complaints pile up. |
| Manufacturing | Site Maintenance Manager, Plant Facilities Manager | Asset-level tracking and audit trail. A QR code on a specific HVAC unit or conveyor tells the technician exactly which asset failed, and creates a timestamped record for health-and-safety compliance. |
| Financial services | Director of Facilities Management, Building Manager | Vendor accountability and analytics. Track when a ticket was raised versus when an outsourced vendor (ISS, Mitie) marked it resolved. Cut duplicate call-outs and show which areas cost the most to maintain. |

### Sequencing: lead where the product is ready

The three hooks map onto how ready the product is to deliver them in a demo. Lead
outreach with the hook the product can already prove, and bring the others online as
the supporting features ship.

| Vertical | Hook depends on | Product today | Order |
|---|---|---|---|
| Tech / workplace | No-login scan-and-report | This is the core product already | First |
| Manufacturing | Per-asset QR plus timestamped audit-trail export | Per-location UIDs and timestamps exist; compliance export does not | Second |
| Financial services | SLA timers, vendor view, resolution and per-area cost analytics | Mostly unbuilt | Third |

The rule: do not pitch a hook the product cannot show in a 15-minute demo.

### The pilot: a frictionless micro-pilot

The first ask is a 15-minute call with a demo, then a contained 30-day pilot, not a
building-wide rollout. The pilot exists to prove that end users will scan the codes and
that the resulting data is accurate and actionable. It is not there to prove the
software can run a global portfolio.

Five rules make it easy to say yes:

1. Constrain the blast radius. Tag one asset class ("the 15 coffee machines across your
   campus") or one high-traffic zone ("reception and the ground-floor meeting rooms").
   The manager monitors one workflow rather than training a whole team.
2. White-glove onboarding. We do 100% of the setup. Hand them a dashboard already
   populated with their test zones, go on site for an hour to stick the codes on
   ourselves, and supply ready-made "scan to report an issue" posters and table tents.
3. Bypass enterprise IT. Position it as a standalone web tool outside their core
   network. End users need no app, just the phone camera and a mobile web form. The
   manager runs the dashboard in a browser with no integration into Jira or ServiceNow.
   Integration is phase two. This sidesteps the SSO and security-review approval that
   would otherwise stall a deal for months.
4. Define success upfront. Agree the exact metrics before the first code goes on a
   wall: a target number of fault reports captured via QR, a reduction in time to locate
   a broken asset, and an end-to-end resolution-time baseline for the tagged assets.
5. A no-risk off-ramp. "At the end of 30 days we review the data. If it hasn't saved
   your team time, I come back, peel the stickers off, and you owe nothing."

### What the pilot needs from the product

Most of the pilot runs on what exists. Two items are net-new and small, and one
positioning point should be loud in the pitch.

| Pilot step | What it needs | Status |
|---|---|---|
| Contained 30-day pilot, ~15 assets | Labels for one asset class, comp Prime with a 30-day expiry | Ready: unlimited labels, per-location UID, `plan_expires_at` all exist |
| Pre-populated dashboard handed over | Magic-link into a pre-built org | Ready once the provisioning console assembles it |
| We tag the assets | Avery label PDF export | Ready |
| "Scan to report" posters and table tents | Printable collateral template | New, small build (mirrors label-PDF generation) |
| Bypass IT | No app, no SSO, no backend integration | Ready, and a headline strength to state plainly |
| Define success | A pilot scorecard: report count and resolution-time baseline | New, minimal analytics build, the one real dependency |
| No-risk off-ramp | Clean trial expiry to auto-downgrade | Ready: `comp` plus expiry already does this |

The provisioning console (internal, founder-run) is the trial enabler. Its MVP is a
single-site "pilot kit" generator: create the org as comp Prime with a 30-day expiry,
provision around 15 labels for one asset class, assign a survey template, upload the
customer's logo, generate the label PDF plus the poster, hand over a magic link, and
produce the pilot scorecard for the review meeting. Bulk and multi-site provisioning is
phase two, after a pilot expands.

A separate, earlier need is a live demo or sandbox org with vertical-flavoured sample
data (a "reception" or "HVAC unit" example), because the first ask is a call with a
demo before any pilot.

## Pricing and tiers

QR labels are never limited on any tier. Labels on physical walls are the distribution
moat and a per-scan marketing loop; limiting them would undercut growth. Conversion is
driven by two other levers for two customers: single-site operators upgrade to look
professional (remove ads, add their own logo); multi-site and large orgs upgrade
because they hit capacity limits (team size, alert channels, analytics, integrations).

Starter is free forever: unlimited labels, two of four Avery sheet types, owner plus two
team members, email alerts, Supabase backend, ads on the reporter page and dashboard
list, and a "Powered by ScanSolve" line.

Prime is the paid tier: no ads anywhere, the customer's own logo, up to 20 team members,
all four sheet types, and instant push alerts.

Enterprise is price-on-application: unlimited team members, advanced analytics and
export, own-data backends (Sheets, Airtable), Slack and Teams integration, and the usual
enterprise asks (SSO, SLA, custom domain, multi-site grouping). Most of this is the
unbuilt work the enterprise hooks above depend on.

`plan_source` records how a Prime grant was made: `free`, `paid`, `voucher`, or `comp`.
Pilots use `comp` with a `plan_expires_at` date, so they downgrade cleanly when the
trial ends.

## Outreach and ICP

Outreach is founder-led and manual: email, LinkedIn DM, and Instagram DM. The first ~50
messages go out by hand so every reply is read and learned from. No auto-sending, no
scraping. The first message does not sell the whole system; it asks for one low-friction
yes, a 15-minute call or a localised pilot.

LinkedIn title searches for building the prospect list:

- "Facilities Manager" plus a city
- "Head of Workplace"
- "Hard Services Manager"
- "Operations and Facilities"
- "Director of Facilities Management"

The `scansolve-outreach` and `scansolve-brand-voice` skills currently target gyms only.
They need the three facilities-management personas, the per-vertical hooks, and these
title strings added.

The LinkedIn connections export (requested 2026-06-16, can take up to 24 hours to
arrive) is the sourcing engine for this strategy. Once it lands, score contacts against
the facilities-management personas to find people already in the network.

## History and decisions

Prior go-to-market planning, in order, with the reasoning behind each call.

Pre-launch, the live site promised "free for your first year." That was replaced by a
permanent freemium ladder (Starter, Prime, Enterprise) so the product looks like an
established SaaS and migrates users up over time. "Founding member" language was retired
at the same time.

A proposed seven-skill marketing automation machine (SEO autopilot, RSS-to-social,
programmatic video, an orchestrator) was rejected as premature. At zero users,
automation hides the signal. First signups come from founder-led direct outreach that
lands free pilots, so the only marketing pieces built were the brand-voice and outreach
skills.

The original beachhead was gyms and leisure: high visible-issue volume, owner-operated,
fast decisions, easy to find on Google Maps, active on Instagram. The two-lever
conversion model came from this: single-site operators convert to look professional;
multi-site operators convert because they outgrow the free limits.

Vouchers and comp grants were added so key prospects and reference customers can get
free Prime for a fixed duration or for life, separate from the Stripe billing path.

On 2026-06-16 the strategy was extended from the gym-only beachhead to the champion-led
enterprise motion described at the top of this document. This came from four pieces of
external analysis: target the champion not the C-suite; use per-vertical personas and
hooks; sequence outreach by which hook the product can already demo; and run a contained,
white-glove, IT-bypassing 30-day micro-pilot with agreed success metrics and a no-risk
off-ramp. The enterprise motion runs alongside gyms, it does not replace them.

## Related plans

The full project planning (technical execution, database schema, deployment workflow,
support widget, security backlog) lives in `~/.claude/plans/keen-knitting-shell.md`.
That file is machine-local and not in this repo. Deployment rules and architecture are
also summarised in the project `CLAUDE.md`.

## Open items

- Build the two net-new pilot dependencies: the "scan to report" poster or table-tent
  template, and the pilot scorecard (report count plus resolution-time baseline).
- Build the single-site provisioning console (pilot-kit generator) and a demo or
  sandbox org with vertical sample data.
- Update the `scansolve-outreach` and `scansolve-brand-voice` skills with the
  facilities-management personas, hooks, and LinkedIn title strings.
- Score the LinkedIn connections export against the personas once it arrives.
- The white-hat security audit fixes were applied to the working tree but not yet built,
  PR'd, or merged. They still need to ship through the normal PR workflow.
