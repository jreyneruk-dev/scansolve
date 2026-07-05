# Over-engineering audit

Analysis date: 2026-07-05. What to delete or simplify in ScanSolve, ranked by value.
The lens is a lazy senior dev: less code, no new dependencies. Findings are verified
against the code, not the planning docs. Cross-references `.planning/codebase/CONCERNS.md`.

## Delete now (safe, no behaviour change)

Three dependencies have zero imports anywhere in `app/`, `lib/`, `components/`, or
`admin-tool/`, and can be removed from `package.json`:

- `@anthropic-ai/sdk` (7.6 MB installed). Never imported. It is also the source of the
  doc-drift where `CLAUDE.md` claims Anthropic powers AI Suggest; the code uses Google
  Gemini. Removing the package removes the confusion.
- `pg` (0.1 MB). Never imported. The app talks to Postgres only through `@supabase/*`.
- `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-toast`.
  Zero component uses each (only `@radix-ui/react-separator` is used, once). The app
  rolls its own modal/toast markup, so these three are unused.

The empty `scripts/` directory can be deleted (or populated). It reads as leftover tooling.

Effort: one `npm uninstall` line plus deleting a directory. Run `npm run build` after.

## The big one: 194 MB of Google API weight behind a "coming soon" feature

`googleapis` is 194 MB installed and is imported only by `lib/db/sheets-adapter.ts` (the
`app/api/support/chat/route.ts` match is the Gemini REST URL string
`generativelanguage.googleapis.com`, not the package). The Sheets adapter is disabled in
the UI as "coming soon" (`components/dashboard/BackendSettings.tsx`) and has never run
against a real backend. So the single largest dependency in the tree exists to serve a
feature no customer can turn on.

Recommendation: while Sheets stays deferred, move `googleapis` (and the Sheets/Airtable
adapter files) out of the build. Options, cheapest first: gate the backend switch
server-side so the adapters are unreachable and lazy-import `googleapis` only inside the
Sheets adapter so it is not in the main bundle; or delete the two adapter files and the
dependency until the first Enterprise conversation actually asks for own-data backends,
then bring back a hardened version. Either way the "own-data backends" promise on the
Enterprise tier should not rest on 194 MB of never-run code.

This finding overlaps with the foundations review (Sheets/Airtable never exercised) and
the concerns map (full-sheet-scan performance). Treat the adapters as one decision:
harden-and-ship or delete-and-defer. Do not leave them half-wired.

## Simplify when you next touch these

`getServiceClient()` is copy-pasted in 22 files — the same six lines creating a
service-role Supabase client. `app/api/issues/route.ts` inlines `createClient` directly
instead. This is the most-duplicated block in the codebase and it wraps the most
dangerous capability (the RLS-bypassing key). One exported helper in `lib/supabase/`
replaces all 22 copies and gives a single place to add logging or guards later. Do it as
part of the org-typing pass (the concerns map recommends the same consolidation).

`uuid` (imported by `app/api/locations/route.ts` and the Sheets adapter) can be replaced
with the native `crypto.randomUUID()` on Node 18+. One import swap per site removes a
dependency. Low priority, but free the next time either file is edited.

`app/api/support/chat/route.ts` is 880 lines, roughly 700 of which are a hardcoded
product-knowledge prompt (pricing, flows, settings copy). Every product change silently
invalidates it and there is no link between the prompt and the code it describes. This is
not over-abstraction, it is the opposite: a giant literal that will rot. When support
answers next go stale, generate the prompt from the existing docs (`docs/`, pricing page)
rather than hand-editing the string.

## What is NOT over-engineered

Worth stating so these do not get "simplified" by mistake. The `IDataAdapter` interface
looks like speculative abstraction but it is load-bearing for the Enterprise own-data
story, so keep the interface even if the Sheets/Airtable implementations are deferred.
The two-tier auth (service-role reporter routes vs magic-link managers) is essential
complexity, not accidental. The vendored animation files carry `@ts-nocheck` and
`eslint-disable` on purpose; leave them.

## Ranked summary

| Action | Value | Effort | Risk |
|---|---|---|---|
| Remove `@anthropic-ai/sdk`, `pg`, 3 unused Radix packages | Smaller install, less audit surface, kills a doc-drift | 15 min | None |
| Decide Sheets/Airtable: harden-and-ship or delete-and-defer `googleapis` (194 MB) | Removes the largest dep and an untested Enterprise promise | Half a day either way | Low |
| Delete empty `scripts/` | Tidiness | 1 min | None |
| Extract one `getServiceClient()` helper (22 copies) | One place to guard the service-role key | 1 hour | Low |
| Replace `uuid` with native `crypto.randomUUID()` | One fewer dependency | 15 min | None |
| Generate the support-chat prompt from docs | Stops the 700-line prompt rotting | Half a day, when it next goes stale | Low |
