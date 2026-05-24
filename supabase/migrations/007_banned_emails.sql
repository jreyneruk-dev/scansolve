-- ============================================================
-- 007: Banned emails table
--
-- Stores email addresses that have been permanently banned by
-- an admin. Checked server-side at:
--   - /auth/callback (after any successful login)
--   - POST /api/invites/[token] (invite acceptance)
--   - /onboarding (org creation)
--
-- Only accessible via the service role key. No RLS policies
-- are needed for anon/authenticated roles — all checks are
-- done server-side using the service role.
-- ============================================================

CREATE TABLE IF NOT EXISTS banned_emails (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email     TEXT UNIQUE NOT NULL,           -- stored lowercase
  banned_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE banned_emails ENABLE ROW LEVEL SECURITY;

-- Deny all access from anon/authenticated roles — service role only
CREATE POLICY "no_access_anon" ON banned_emails
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);
