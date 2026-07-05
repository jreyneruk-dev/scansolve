# ScanSolve Admin Tool

Internal customer service portal. **Runs locally only — never deployed.**

## Setup

Add these to `qr-issue-tracker/.env.local`:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=choose-a-strong-password
```

(It already has `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — the admin tool reads those automatically.)

## Run

```bash
cd admin-tool
npm install      # first time only
npm start
```

Open **http://localhost:3001** in your browser.

## Features

| Feature | Notes |
|---|---|
| View all organisations | Name, plan, source, member count, issue count, creation date |
| Tier breakdown | Starter / Prime / Enterprise counts + Prime split by Paid / Voucher / Comp |
| Owner email | Blurred by default — click to reveal |
| Edit org name | Inline edit with save/cancel |
| Change plan | Starter / Prime / Enterprise dropdown. Reflects *effective* plan (expired vouchers read as Starter) |
| Plan source | Per org: Paid (Stripe) / Voucher / Comp / lapsed, with voucher expiry and a Stripe customer link |
| Manual Prime/Enterprise | Grants are tagged `comp` (complimentary); a real Stripe `paid` source is preserved, never overwritten |
| Vouchers | List all codes (uses, expiry, notes) + generate new codes (tier, duration, max-uses, notes) |
| Recent redemptions | Last 10 voucher redemptions (code → org) |
| Delete org | Confirmation required; cascades all data |
| Recent signups | Orgs created in last 7 days |
| Recent invites | Invites sent in last 7 days (emails blurred) |
| Expired invites | Pending invites that have now expired |

> Manual plan changes only flip the local plan flag. If an org pays via Stripe, also cancel/refund in the Stripe dashboard — the admin tool does not touch Stripe.

## Security

- Runs on `127.0.0.1:3001` only — not reachable from the internet
- Session cookie is HMAC-signed with a random key (invalidated on server restart)
- No connection to Vercel or the public app
- Uses the Supabase service role key directly (same one in your .env.local)

## Stop

`Ctrl+C` in the terminal where it's running.
