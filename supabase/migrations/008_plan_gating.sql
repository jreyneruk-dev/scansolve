-- ============================================================
-- 008: Plan gating — tier rename + voucher support
--
-- Changes:
--   1. Rename plan values: 'pro' → 'prime', add 'enterprise'
--   2. Add plan_expires_at (null = permanent) and plan_source
--      to organizations so time-limited vouchers work correctly
--   3. Create vouchers + voucher_redemptions tables
-- ============================================================

-- ── 1. Update the plan CHECK constraint ─────────────────────

-- Drop the old inline constraint (auto-named by Postgres)
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_plan_check;

-- Migrate any existing 'pro' rows → 'prime'
UPDATE organizations SET plan = 'prime' WHERE plan = 'pro';

-- Add new constraint covering all three values
ALTER TABLE organizations
  ADD CONSTRAINT organizations_plan_check
  CHECK (plan IN ('free', 'prime', 'enterprise'));

-- ── 2. New columns on organizations ─────────────────────────

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS plan_expires_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_source      TEXT NOT NULL DEFAULT 'free'
    CHECK (plan_source IN ('free', 'paid', 'voucher'));

-- Back-fill plan_source for anyone already on prime/enterprise
UPDATE organizations
  SET plan_source = 'paid'
  WHERE plan IN ('prime', 'enterprise');

-- ── 3. Vouchers table ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vouchers (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT        UNIQUE NOT NULL,
  tier        TEXT        NOT NULL DEFAULT 'prime'
                CHECK (tier IN ('prime', 'enterprise')),
  duration    TEXT        NOT NULL
                CHECK (duration IN ('lifetime', '1year', '1month')),
  max_uses    INT         NOT NULL DEFAULT 1,
  use_count   INT         NOT NULL DEFAULT 0,
  notes       TEXT,                          -- internal memo
  created_by  TEXT,                          -- admin email
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ                    -- when the *code* itself expires (not access)
);

ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

-- Service role only — no client access
CREATE POLICY "no_client_access_vouchers" ON vouchers
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- ── 4. Voucher redemptions table ────────────────────────────

CREATE TABLE IF NOT EXISTS voucher_redemptions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id   UUID        NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  org_id       UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  redeemed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (voucher_id, org_id)    -- one redemption per org per voucher
);

ALTER TABLE voucher_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no_client_access_redemptions" ON voucher_redemptions
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);
