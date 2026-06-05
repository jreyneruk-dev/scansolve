-- 011_plan_source_comp.sql
--
-- Allow 'comp' as a plan_source. This is a complimentary Prime/Enterprise
-- grant made manually from the internal admin tool — distinct from a Stripe
-- 'paid' subscription or a redeemed 'voucher'. Migration 008 created the
-- original CHECK constraint with only ('free','paid','voucher'), so writing
-- 'comp' was rejected by organizations_plan_source_check.

ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_plan_source_check;

ALTER TABLE organizations
  ADD CONSTRAINT organizations_plan_source_check
  CHECK (plan_source IN ('free', 'paid', 'voucher', 'comp'));
