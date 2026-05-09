-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  owner_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan        TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  backend     TEXT NOT NULL DEFAULT 'supabase' CHECK (backend IN ('supabase', 'sheets', 'airtable')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_manage_org" ON organizations
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ============================================================
-- LOCATIONS
-- ============================================================
CREATE TABLE locations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  uid            TEXT UNIQUE NOT NULL,
  name           TEXT NOT NULL,
  description    TEXT,
  floor_plan_url TEXT,
  survey_config  JSONB NOT NULL DEFAULT '{
    "categories": [],
    "fields": {
      "description": {"enabled": true, "required": false},
      "photo": {"enabled": true, "required": false},
      "contact": {"enabled": true, "required": false}
    },
    "success_message": "Thank you! We will look into this shortly."
  }'::jsonb,
  claimed_by     UUID REFERENCES auth.users(id),
  claimed_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Super Users can manage their org's locations
CREATE POLICY "org_manage_locations" ON locations
  USING (
    org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Public read of locations by uid (for reporter survey fetch — controlled at API layer)
-- We expose only needed fields via API route, NOT direct DB access from client
-- No public RLS policy needed since reporters hit the API, not Supabase directly

-- ============================================================
-- ISSUES
-- ============================================================
CREATE TABLE issues (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id   UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'reported'
                CHECK (status IN ('reported', 'assigned', 'in_progress', 'resolved')),
  category      TEXT NOT NULL,
  description   TEXT,
  photo_url     TEXT,
  contact_email TEXT,
  reporter_meta JSONB,
  assigned_to   TEXT,
  assigned_at   TIMESTAMPTZ,
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Reporters: insert-only via service role (API handles this, not anon key)
-- Super Users: full access to their org's issues
CREATE POLICY "org_manage_issues" ON issues
  USING (
    org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
-- Run this in Supabase Dashboard > Storage or via CLI:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('issue-photos', 'issue-photos', false);
--
-- Storage policies (restrict to service role via API):
-- All uploads/reads go through Next.js API routes using service role key.
-- No direct client storage access needed.

-- ============================================================
-- HELPER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_org_id(user_id UUID)
RETURNS UUID AS $$
  SELECT id FROM organizations WHERE owner_id = user_id LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
