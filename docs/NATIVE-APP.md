# ScanSolve staff app (iOS and Android)

The store apps are a Capacitor shell that loads the live staff dashboard at
`https://scansolve.co/dashboard`. Screens come from the website, so a normal web deploy
updates them without a store release. Anything native needs a new store build: plugins,
permissions, icons, `capacitor.config.ts`, or anything under `mobile/`.

Do not ship a new native-only feature through a web deploy alone. Apple reviews the app as
it was submitted (guideline 2.5.2).

## What is native

| Feature | Where |
|---|---|
| QR scanner (scan a label, open its commission page) | `lib/native-scan.ts`, `lib/label-url.ts`, Scan button in `DashboardNav` |
| Push alerts for new issues (FCM, delivered via APNs on iOS) | `lib/native-push.ts`, `lib/fcm.ts`, `lib/notify.ts`, table `native_push_tokens` |
| Offline screen on first load, offline banner after | `mobile/www/offline.html`, `components/native/NativeBridge.tsx` |
| Android back button, status bar, splash | `NativeBridge.tsx`, `capacitor.config.ts` |

The app adds `ScanSolveApp/1` to its user agent. `lib/native.ts` reads it, and the server
uses it to keep purchase prompts out of the app (Apple 3.1.1). In the app:

- `/`, `/pricing` and `/dashboard/billing` redirect to `/dashboard` (`middleware.ts`).
- `/api/stripe/checkout` returns 403.
- Upgrade prompts, the Billing link, the support chat (it quotes prices), label printing and
  CSV export are hidden. Printing and export need a computer.

Changes that also affect the web:

- Staff can log an issue without a QR label from the Issues page, giving the location as
  free text (migration 014).
- Settings has a Delete account section (migration 015). An owner deletes the whole
  organisation after the subscription is cancelled; a member removes only themselves.

## Environment variables (Vercel)

| Variable | Purpose |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Service-account JSON on one line, for sending FCM pushes |
| `REVIEW_EMAIL` | App review sign-in email (`appreview@scansolve.co`) |
| `REVIEW_CODE` | 8-digit code the reviewer types instead of an emailed one |
| `REVIEW_ORG_ID` | The seeded "ScanSolve Demo" organisation |

Copy the three `REVIEW_*` values from `.env.local`. `node scripts/native/seed-review-org.mjs`
wrote them there. The review sign-in only works for a user whose only organisation is the
demo org, so a leaked code can't open customer data. Re-run the seed script before each
submission: it is idempotent and resets the demo data. If a reviewer tests account
deletion, the demo account is gone, and the seed script recreates it.

## Building: Codemagic, not this Mac

App Store uploads must be built with Xcode 26 or later (since 28 April 2026; Xcode 27 from
April 2027), which needs macOS 15.6+. The development Mac (2015 MacBook Pro, macOS 14) can't
run it, so both apps build on Codemagic's hosted Macs from `codemagic.yaml`. Pushing a tag
that starts with `app-v` (for example `app-v1.0.0`) runs both workflows. iOS goes to
TestFlight; Android goes to the Play closed-testing track as a draft.

The iOS project was generated without CocoaPods, and `pod install` runs in CI. Push
capability (`App/App.entitlements`), background push mode, the camera usage text, the
privacy manifest and Firebase are already set up in the project, so you don't need to open
Xcode.

## One-time setup

1. Firebase: create a project and add two apps, both with id `co.scansolve.app`.
   - Upload an APNs auth key (.p8, from developer.apple.com, Keys) under Project settings,
     Cloud Messaging.
   - Download `google-services.json` and `GoogleService-Info.plist`. Don't commit them.
     Base64 them (`base64 -i file | pbcopy`) into the Codemagic environment group
     `firebase` as `GOOGLE_SERVICES_JSON_B64` and `GOOGLE_SERVICE_INFO_PLIST_B64`.
   - Create a service account with the "Firebase Cloud Messaging API Admin" role. Set its
     JSON, on one line, as `FIREBASE_SERVICE_ACCOUNT` in Vercel.
2. Apple: in App Store Connect, create the app (bundle id `co.scansolve.app`). Create an
   App Store Connect API key (Users and Access, Integrations) with App Manager access, and
   add it in Codemagic under Team integrations, named `scansolve_asc`. Codemagic then
   creates the signing certificate and provisioning profile itself.
3. Google: create the app in Play Console and register the package under developer
   verification. Create an upload keystore with `keytool`. It needs a JDK; this Mac has
   none, so install Temurin 21 from adoptium.net (~190 MB). Then run:

   ```bash
   keytool -genkeypair -v -keystore scansolve-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```

   Upload it in Codemagic under Code signing identities, Android keystores, with reference
   `scansolve_upload`. Keep a copy and its passwords somewhere safe. Play App Signing lets
   Google reset a lost upload key, but that takes days. Create a Play service account with
   release permissions, and add its JSON to the Codemagic group `google_play` as
   `GOOGLE_PLAY_SERVICE_ACCOUNT_CREDENTIALS`. Google requires the very first upload to be
   made by hand in Play Console: download the `.aab` from the first Codemagic build and
   upload it.
4. Connect the GitHub repo in Codemagic, then push `app-v1.0.0`.

## Day-to-day

```bash
npx cap sync                          # after changing plugins or capacitor.config.ts
node scripts/native/make-icons.mjs    # regenerate icon and splash sources in mobile/assets
git tag app-v1.0.1 && git push origin app-v1.0.1   # build both apps on Codemagic
```

Build numbers come from Codemagic's `BUILD_NUMBER`. The version shown in the stores is
`MARKETING_VERSION` (iOS project) and `versionName` (set from the build number on Android).

Gate checks live in `scripts/native/check-*.mjs`. They run against `npm run dev` on port 3000
and the Supabase project in `.env.local`. They create throwaway users and organisations, and
delete them afterwards.

## Store listing (draft)

Name: ScanSolve (fallback if taken: ScanSolve Facilities)

Subtitle (30 chars): Facility faults, fixed faster

Description:

> ScanSolve is the staff app for facilities teams that use ScanSolve QR labels.
>
> When someone scans a label in your building and reports a fault, it lands in your issue
> list. You get a notification on your phone, assign it, and mark it fixed.
>
> In the app you can:
> - See every reported issue, filter by status and update it
> - Scan a new label to set it up at a location
> - Log an issue yourself when there's no label nearby, describing where it is
> - Get an alert the moment something is reported
>
> People reporting faults don't need the app or an account. They scan the label with their
> phone camera.
>
> You need a ScanSolve account to sign in. Sign up at scansolve.co.

Keywords (iOS, 100 chars): facilities,maintenance,fault,report,QR,issue,tracker,building,helpdesk,repair

Category: Business (secondary: Productivity)

Privacy policy: https://scansolve.co/privacy · Support: support@scansolve.co ·
Account deletion (Google): https://scansolve.co/privacy#delete-account

## Privacy answers (from what the code does)

Apple App Privacy and Google Data safety should both say the following. Nothing is used
for tracking or advertising, and nothing is sold.

| Data | Collected for | Linked to user |
|---|---|---|
| Email address | Account sign-in, notifications | Yes |
| Name of organisation and locations | App functionality | Yes |
| Photos (optional, attached to an issue) | App functionality | Yes |
| Other user content (issue descriptions, locations typed by staff) | App functionality | Yes |
| Device ID (push token, only if alerts are on) | App functionality (notifications) | Yes |
| Product interaction (anonymous page views, Vercel Analytics, cookieless) | Analytics | No |

Data is encrypted in transit. Users can delete their account in the app.
The camera reads QR codes on the device; no camera images are sent or stored.

Age rating: no objectionable content. 4+ (Apple), Everyone (Google).

## Review notes (Apple) / test instructions (Google)

> ScanSolve is a business tool for facilities staff. Accounts are created at
> scansolve.co; the app is for managing issues reported in the customer's buildings.
>
> Demo sign-in: enter appreview@scansolve.co, tap Send Magic Code, then enter the code
> [REVIEW_CODE] and tap Verify & Sign In. No email is actually sent to this address.
>
> The demo organisation has four locations and five sample issues.
> - To try the scanner, tap Scan and point it at the attached QR label image. It opens
>   the label's setup page.
> - To log an issue without a label, tap Log issue on the Issues page.
> - Account deletion is in Settings, Delete account. Please test it last; we recreate the
>   demo account afterwards.
>
> Subscriptions are bought on our website by the customer's organisation. The app has no
> purchasing and doesn't link to it.

Attach a PNG of a demo label to the review notes. Generate it from the demo org's Labels
page on a computer.

## Release checklist

- [ ] `REVIEW_*` and `FIREBASE_SERVICE_ACCOUNT` set in Vercel; seed script re-run.
- [ ] Web PR merged and deployed (the app loads production).
- [ ] iOS `MARKETING_VERSION` bumped if it's a new version (build numbers are automatic).
- [ ] Screenshots taken in the app, showing the issue list, an issue, the scanner and Log issue. No sign-in screen.
- [ ] Google: a 14-day closed test with at least 12 testers is done (personal account rule).
- [ ] Google: package `co.scansolve.app` registered under developer verification.
- [ ] Supabase is up on the day of submission (free tier pauses after 7 days idle).
