-- ============================================================
-- 006: Fix recursive RLS on org_members
--
-- The "members_select_own_org" policy contained a self-referential
-- subquery:
--
--   USING (org_id = (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
--
-- PostgreSQL evaluates this subquery under the same RLS policy,
-- creating a bootstrap deadlock: new invited members have a row
-- (inserted via service_role) but cannot see it, so getOrgForUser
-- returns nothing and they are redirected to /onboarding.
--
-- Fix: replace with a simple user_id = auth.uid() check (no recursion).
-- Members can see their own row; team-listing features use the service
-- role and do not rely on this policy for cross-member visibility.
-- ============================================================

DROP POLICY IF EXISTS "members_select_own_org" ON org_members;

CREATE POLICY "members_select_own" ON org_members
  FOR SELECT USING (user_id = auth.uid());
