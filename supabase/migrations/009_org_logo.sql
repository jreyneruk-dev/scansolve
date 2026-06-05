-- ============================================================
-- 009: Org logo URL
--
-- Adds logo_url to organizations. Populated server-side when
-- a Prime/Enterprise org uploads their logo. Null = no logo
-- (show ScanSolve branding). Stored as a long-lived signed URL
-- from the issue-photos Supabase Storage bucket.
-- ============================================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS logo_url TEXT;
