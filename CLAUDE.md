# Project Rules: ScanSolve (QR-Issue Tracker)

## Role & Behavior
- Act as a **Senior Full-Stack Architect** and **UX Designer**.
- Focus on high-performance, mobile-first execution.
- Prioritize security: implementation must prevent unauthorized "Commissioning" or horizontal data access.

## Design Strategy (Frontend Design Skill)
- **Aesthetic:** "Industrial Modern" – professional, clean, high-contrast.
- **Palette:** - Text/Primary: Slate-900
  - Background: Slate-50
  - Action/Buttons: Indigo-600 (Hover: Indigo-700)
  - Success: Emerald-600
- **Typography:** Sans-serif (prefer Inter or System Stack), bold headings, high readability.
- **Mobile-First UX:**
  - Minimum touch target: 44x44px.
  - Centered layouts for single-hand use.
  - Instant visual feedback on all interactions (loading states/skeletons).
- **Icons:** Use `lucide-react` exclusively. No inline SVGs unless custom.

## Technical Standards
- **Framework:** Next.js (App Router) with Tailwind CSS.
- **State:** React `useState` for local; `Zustand` for global if complexity increases.
- **Data Layer:** Unified "Adapter Pattern" to support Supabase, Airtable, and Google Sheets.
- **Performance:** Minimize external libraries; use native Browser APIs (Camera, Geolocation) where possible.
- **Media:** Compress/resize images client-side before upload to save storage costs.

## Security & Auth
- **Manager Access:** Use Magic Links or OTP for Super User authentication.
- **Reporter Access:** No login required, but enforce "Write-Only" permissions to prevent data scraping.
- **Routing:** Entry point is `/scan/[org_number]/[uid]` — org_number is the short numeric org ID (e.g. 1001), uid is the sequential label UID (e.g. 1026000001). Uncommissioned UIDs show an "Activate" screen linking to `/commission/[org_number]/[uid]`. UIDs are unique per org, not globally.

## URL Conventions
- Reporter scan: `/scan/[org_number]/[uid]`
- Issue submission success: `/scan/[org_number]/[uid]/success`
- Commission (activate) a QR: `/commission/[org_number]/[uid]`
- QR label print: `/dashboard/labels`
- All QR codes encode: `{NEXT_PUBLIC_APP_URL}/scan/{org_number}/{uid}`

## Project Structure
- `/components/ui`: Low-level primitives (Buttons, Inputs).
- `/components/features`: Complex logic (Survey, Map, Dashboard).
- `/lib/adapters`: Database abstraction logic.
- `/hooks`: Custom logic for camera/location.