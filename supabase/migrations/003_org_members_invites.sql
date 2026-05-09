-- Multi-member org support
CREATE TABLE IF NOT EXISTS org_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (org_id, user_id)
);

-- Backfill existing owners
INSERT INTO org_members (org_id, user_id, role)
SELECT id, owner_id, 'owner'
FROM organizations
WHERE owner_id IS NOT NULL
ON CONFLICT (org_id, user_id) DO NOTHING;

-- Invite tokens
CREATE TABLE IF NOT EXISTS org_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  invited_by  UUID REFERENCES auth.users(id),
  token       TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_invites  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_select_own_org" ON org_members
  FOR SELECT USING (org_id = (
    SELECT org_id FROM org_members m2 WHERE m2.user_id = auth.uid() LIMIT 1
  ));

CREATE POLICY "invites_select_own_org" ON org_invites
  FOR SELECT USING (org_id = (
    SELECT org_id FROM org_members WHERE user_id = auth.uid() LIMIT 1
  ));
