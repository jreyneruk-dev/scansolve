# SEO / discoverability audit — scansolve.co

Date: 2026-07-05
Method: fetched the live site (`/`, `/pricing`, `/about`, `/privacy`, `/robots.txt`, `/sitemap.xml`, `/og-image.png`, `/scan/1001/1026000001`, `/auth`) with curl and cross-checked every finding against the repo (`app/layout.tsx`, `app/page.tsx`, `app/pricing/page.tsx`, `app/about/page.tsx`, `app/sitemap.ts`, `app/robots.ts`). Live output matches the code in every case checked, and all meta tags and JSON-LD are server-rendered (visible to curl, so visible to every crawler). PageSpeed lab data was unavailable (keyless API quota exhausted); performance notes below are inferred from headers and payload sizes.

## Summary

The technical hygiene is mostly good: server-rendered metadata, one H1 per page, self-referencing canonicals on the marketing pages, a real 1200x630 OG image, correct viewport, a sensible robots.txt with an explicit AI-crawler policy, and valid JSON-LD. The problems are concentrated in three places: the sitemap omits `/pricing`, page-level metadata overrides collide badly with the layout defaults (double-brand titles, wrong or stripped Open Graph tags on `/pricing` and `/about`), and — the biggest issue by far — the site has only 4 indexable pages and none of them use the vocabulary buyers type when shopping this category. ScanSolve is findable for its own name and little else.

## 1. Title tags and meta descriptions

| Page | Live title | Verdict |
|---|---|---|
| `/` | ScanSolve — QR Code Facility Issue Reporting (44 ch) | Good length. Brand-led; carries "facility issue reporting" but none of the higher-volume category terms. |
| `/pricing` | Pricing — ScanSolve \| ScanSolve (31 ch) | Brand appears twice. `app/pricing/page.tsx` sets `title: "Pricing — ScanSolve"` and the layout template (`%s \| ScanSolve`) appends the brand again. Also wastes the slot: no keyword at all. |
| `/about` | About ScanSolve — QR Code Facility Issue Reporting \| ScanSolve (62 ch) | Brand twice, and it truncates in SERPs (~60 ch limit). |
| `/privacy` | Privacy Policy — ScanSolve \| ScanSolve | Same double-brand pattern. |
| `/auth` | Sign In — ScanSolve \| ScanSolve | Same pattern; noindexed so cosmetic only. |

Fix pattern: page titles should never include "ScanSolve" — the layout template adds it. `title: "Pricing"` renders as "Pricing | ScanSolve".

Meta descriptions: home is 165 characters ("…Free forever on the Starter plan.") and will be cut around 155–160. Pricing (135 ch) and about (152 ch) are fine. All three read well and match page content. None mention maintenance, work orders, or CMMS — same gap as the titles.

## 2. Open Graph and Twitter cards

The OG image exists, is served (200, 66 KB PNG), and is genuinely 1200x630 as declared. The homepage card is complete: og:title, og:description, og:url, og:site_name, og:locale, og:type, og:image with width/height/alt, twitter:card `summary_large_image` with title/description/image.

The child pages are broken in two different ways, both caused by how Next.js merges metadata (page-level `openGraph` replaces the layout's object wholesale):

- `/pricing` defines no `openGraph` at all, so it inherits the layout's — including `og:url = https://scansolve.co`. A share of the pricing page claims to be the homepage, with the homepage title and description. Confirmed live.
- `/about` defines `openGraph: { url }` only, which throws away the rest: the live about page has og:title/og:description/og:url but no og:image, og:type, og:site_name, or og:locale. Shares of `/about` get no image.

Twitter tags on both child pages fall back to the layout's homepage copy. No `twitter:site`/`twitter:creator` handle anywhere — only worth adding if an X account exists.

## 3. Structured data (JSON-LD)

Every page renders the layout graph; the homepage adds a second block. All blocks parse as valid JSON.

- Organization — name, logo (icon.png, 200), contactPoint, foundingDate, sameAs. The LinkedIn URL resolves (200). The Crunchbase URL returns 403 to anonymous requests so it could not be verified; confirm the profile actually exists or drop it, since a dead sameAs is a negative trust signal.
- WebSite — fine. No SearchAction, correctly, since there is no site search.
- SoftwareApplication — applicationCategory, operatingSystem, and a £0 Offer. Without `aggregateRating` or `review` it will not earn a rich result. Do not fabricate ratings; collect real G2/Capterra reviews first, then add the markup. The lone £0 offer also undersells the tier structure — an `AggregateOffer` covering Starter/Prime would describe reality better.
- VideoObject (home) — legitimate. The mp4 is actually embedded on the page (`<video>` with poster), both `contentUrl` and `thumbnailUrl` return 200, and name/description/uploadDate/duration are present. This one is eligible for video rich results.
- FAQPage (home) — 6 Q&As that match the visible FAQ section. Note: since August 2023 Google only shows FAQ rich results for well-known government and health sites, so a commercial SaaS page will not get the accordion. Keep the markup anyway — it is exactly the format AI assistants (ChatGPT, Perplexity, Claude) quote when answering "what is ScanSolve" or "QR code issue reporting" questions, and robots.txt already invites those crawlers in.
- Gap: `/pricing` has a visible "Pricing FAQ" section with no FAQPage markup. Same AI-citation argument applies.

One quirk: because the layout JSON-LD renders on every route, `/scan/*` pages also carry the Organization/WebSite/SoftwareApplication graph. Harmless while those pages stay out of the index.

## 4. robots.txt and sitemap.xml

robots.txt (from `app/robots.ts`) is correct on the essentials: `/dashboard`, `/onboarding`, `/api/`, `/scan/`, `/commission/`, `/auth` are all disallowed for general crawlers, the sitemap is declared, and there is a deliberate AI-crawler policy (GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Amazonbot allowed; CCBot, anthropic-ai, cohere-ai blocked). Minor notes: the `Host:` directive is non-standard (only Yandex ever read it) and the `Allow: /about` / `Allow: /privacy` lines are redundant given `Allow: /`. Both harmless.

sitemap.xml has a real problem: it lists `/`, `/about`, and `/privacy` — and omits `/pricing`, the page every commercial query should land on. `app/sitemap.ts` simply never included it. The page is linked from the homepage so Google will find it eventually, but a 4-page site that leaves its money page out of a 3-URL sitemap is sending exactly the wrong signal. The hardcoded `lastModified` dates (2026-05-25) are acceptable but will go stale silently.

Indexability of app routes: `/auth` correctly serves `noindex, nofollow`. But `/scan/[org]/[uid]` pages serve `index, follow` with a canonical pointing at the homepage — they are protected only by the robots.txt disallow. Robots.txt blocks crawling, not indexing: scan URLs that get shared (texted, posted in a staff group) can still end up in Google as "indexed, though blocked by robots.txt" with a bare URL. With potentially thousands of label URLs, add `robots: { index: false }` metadata to the scan and commission routes as a second layer.

## 5. Canonicals, headings, mobile, performance

Canonicals are self-referencing and correct on `/`, `/pricing`, `/about`, `/privacy`. The trap is in `app/layout.tsx`: `alternates.canonical: APP_URL` means any future page that forgets to set its own canonical silently canonicalises to the homepage and drops out of the index. That is exactly what happens to `/scan/*` today. Safer to remove the layout-level canonical and set it per page. Related: the layout's `alternates.languages: { "en-GB": ... }` never renders on any marketing page (each one overrides `alternates`), and a self-referencing hreflang on a single-language site does nothing — remove it. `<html lang="en">` vs `og:locale en_GB` is a trivial inconsistency; pick one.

Headings: exactly one H1 per page on `/`, `/pricing`, `/about`, with logical H2 structure beneath. The home H1 ("ScanSolve — QR code facility reporting. Issues fixed, not forgotten.") carries a keyword; the pricing H1 ("Start free. Upgrade when you need to.") carries none, which is a defensible conversion choice.

Mobile: correct viewport meta, mobile-first Tailwind layout, 44px touch targets per project convention. No issues found.

Performance signals (no CrUX field data exists yet — the site is too new/low-traffic — and the keyless PageSpeed API quota was exhausted, so run Lighthouse locally before the next growth push): TTFB ~0.5s with `x-vercel-cache: HIT`; homepage HTML 86 KB with 37 script tags (normal Next.js chunking); pricing HTML 155 KB; Inter is self-hosted via next/font (good). One oddity: the AdSense library is loaded site-wide from `app/layout.tsx`, but the CSP in `middleware.ts` (`script-src 'self' 'unsafe-inline'`) does not allow `pagead2.googlesyndication.com`, so the script is blocked in production. Either whitelist it or stop loading it on marketing pages; a blocked third-party script is dead weight either way. Separately, ads anywhere near the marketing funnel read as low-trust for a B2B tool aimed at enterprise facilities managers.

## 6. Positioning and keyword gap

This is the finding that outweighs everything above. Visible homepage text is ~1,175 words. Counting occurrences across it: "QR code" 12, "facilities management" 1, and zero for CMMS, work order, maintenance request, maintenance software, maintenance reporting, preventive, asset. The category ScanSolve competes in (MaintainX, UpKeep, Limble, SafetyCulture, Oxmaint) is searched as "CMMS software", "work order software/app", "maintenance management software", "facility maintenance software", "maintenance request system" — and the site never says any of those words. ScanSolve currently ranks for its own name and for "QR code facility issue reporting", a phrase it coined and nobody searches.

The site also has only 4 indexable URLs (home, pricing, about, privacy). Competitors run hundreds: feature pages, vertical pages, comparison pages, glossaries, blogs. There is no /features page, no vertical landing pages despite the GTM strategy having per-vertical personas and hooks ready (gyms, hotels, offices, schools, FM companies — see `docs/GTM-STRATEGY.md`), no "MaintainX alternative"-style comparison pages, and no editorial content at all.

## How this category is found

Buyers reach CMMS/maintenance software four ways. Branded search ("MaintainX pricing") — ScanSolve wins its own brand and nothing else, which is fine but tiny. Category head terms ("CMMS software", "work order app") — dominated by incumbents and by directories; a new domain will not crack these soon and should not lead with them. Comparison and alternative queries ("UpKeep vs Limble", "MaintainX alternatives", "best CMMS for gyms") — this is where challengers actually get found, and where ScanSolve's genuine wedge ("no app, no login, reporters just scan") gives it a real angle; the `seo-competitor-pages` skill exists for exactly this. Long-tail job-to-be-done queries ("QR code maintenance reporting", "how can tenants report maintenance issues without an app", "gym equipment fault reporting QR") — low volume, low competition, high intent, and the best near-term organic play.

Two channels sit outside the site entirely and matter more than on-page work right now: software directories (Capterra, G2, Software Advice occupy most of page one for "best X software" queries — a free listing gets ScanSolve onto pages that already rank) and AI assistants (the robots.txt policy and FAQ markup are already pointed at this; an `llms.txt` and more quotable FAQ-style content extend it). Given the GTM strategy is champion-led outbound with gyms as the beachhead, SEO is a supporting channel — the comparison and vertical pages double as outreach collateral, which is the right way to sequence the work.

## Prioritized fix list

### Critical

| # | Issue | Fix | File(s) |
|---|---|---|---|
| C1 | Zero category-keyword coverage and only 4 indexable pages; invisible for every non-branded query in the category | Work category vocabulary (maintenance reporting, work order, maintenance request, CMMS-adjacent phrasing) into homepage H2s, body copy, and FAQ answers; then add vertical landing pages matching the GTM personas and 1–2 comparison/alternative pages | `app/page.tsx` (copy), new routes under `app/` (e.g. `app/for/gyms/page.tsx`, `app/compare/...`); follow `docs/GTM-STRATEGY.md` and the `scansolve-brand-voice` skill |

### High

| # | Issue | Fix | File(s) |
|---|---|---|---|
| H1 | `/pricing` missing from sitemap.xml | Add the entry | `app/sitemap.ts` |
| H2 | `/pricing` shares carry og:url of the homepage plus homepage title/description | Add a full page-level `openGraph` block (title, description, url, images) | `app/pricing/page.tsx` |
| H3 | Double-brand titles on `/pricing`, `/about`, `/privacy` (template appends "\| ScanSolve" to titles that already contain it); about title truncates | Strip the brand from page-level titles and let the layout template add it | `app/pricing/page.tsx`, `app/about/page.tsx`, `app/privacy/page.tsx` (and `app/auth/page.tsx` cosmetically) |
| H4 | `/about` openGraph override drops og:image, og:type, og:site_name, og:locale — shares get no image | Include `images` (and title/description) in the page's `openGraph` object, since Next replaces rather than deep-merges it | `app/about/page.tsx` |

### Medium

| # | Issue | Fix | File(s) |
|---|---|---|---|
| M1 | `/scan/*` and `/commission/*` serve `index, follow`; only robots.txt protects them, so shared label URLs can be indexed URL-only at scale | Add `robots: { index: false, follow: false }` metadata to those route segments | `app/scan/[org_number]/[uid]/page.tsx` (or a segment `layout.tsx`), same for `app/commission/...` |
| M2 | Layout-level `alternates.canonical` makes every non-overriding page canonicalise to the homepage (already true for `/scan/*`); `alternates.languages` never renders and does nothing | Remove both from the layout; keep canonicals per page | `app/layout.tsx` |
| M3 | Home meta description 165 chars, truncates in SERPs | Trim to ≤155 | `app/page.tsx` |
| M4 | Pricing page has a visible FAQ with no FAQPage JSON-LD; SoftwareApplication offer only says £0 | Add FAQPage markup mirroring the visible pricing FAQ; consider an AggregateOffer for the tiers | `app/pricing/page.tsx`, `app/layout.tsx` |
| M5 | AdSense script loads site-wide but is blocked by the CSP (`script-src` lacks googlesyndication), so it is dead weight on every page | Either whitelist the domain in the CSP or stop loading the library outside the reporter page | `app/layout.tsx`, `middleware.ts` |

### Low

| # | Issue | Fix | File(s) |
|---|---|---|---|
| L1 | `<html lang="en">` vs `og:locale en_GB` | Align (e.g. `lang="en-GB"`) | `app/layout.tsx` |
| L2 | Crunchbase sameAs URL unverifiable (403 anonymously); LinkedIn confirmed live | Confirm the profile exists or remove the entry | `app/layout.tsx` |
| L3 | Non-standard `Host:` directive and redundant Allow lines in robots.txt | Optional cleanup | `app/robots.ts` |
| L4 | No `twitter:site` handle | Add only if an X account exists | `app/layout.tsx` |
| L5 | No `llms.txt` despite an explicit AI-crawler strategy | Add one describing the product and pointing at the FAQ content | new `public/llms.txt` |
| L6 | Sitemap `lastModified` dates are hardcoded and will go stale | Update when page content changes, or derive from a constant next to the content | `app/sitemap.ts` |

Not action items but worth recording: FAQ rich results are gone for commercial sites (keep the markup for AI citation, as noted); SoftwareApplication rich results need real ratings, which points at getting listed and reviewed on G2/Capterra — an off-site task that also attacks the directory channel above; and no Core Web Vitals field data exists yet, so run Lighthouse locally when convenient.
