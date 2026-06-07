-- 012_push_subscriptions.sql
--
-- Prime feature: real-time browser/PWA push alerts for new issues.
-- One row per installed device; an org can have many. Pushes are sent
-- server-side via the Web Push protocol (VAPID), so no third-party cost.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint    TEXT        UNIQUE NOT NULL,   -- the push service URL (identifies the device)
  p256dh      TEXT        NOT NULL,          -- client public key (payload encryption)
  auth        TEXT        NOT NULL,          -- client auth secret (payload encryption)
  user_agent  TEXT,                          -- for the user to recognise the device
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_org ON push_subscriptions(org_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Service role only — all access goes through server routes (no client reads/writes).
CREATE POLICY "no_client_access_push_subscriptions" ON push_subscriptions
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);
