-- 013_native_push_tokens.sql
--
-- Device tokens for the iOS / Android store apps. Sent via Firebase Cloud
-- Messaging (FCM delivers to APNs on iOS). Same Prime gate and per-org daily
-- cap as browser push (push_subscriptions). Service-role access only.

CREATE TABLE IF NOT EXISTS native_push_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  token       TEXT        UNIQUE NOT NULL,
  platform    TEXT        NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_native_push_tokens_org ON native_push_tokens(org_id);

ALTER TABLE native_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no_client_access_native_push_tokens" ON native_push_tokens
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);
