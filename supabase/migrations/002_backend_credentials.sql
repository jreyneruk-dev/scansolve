-- Add backend configuration to organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS backend TEXT NOT NULL DEFAULT 'supabase'
    CHECK (backend IN ('supabase', 'sheets', 'airtable')),
  ADD COLUMN IF NOT EXISTS backend_credentials TEXT;  -- AES-256-GCM encrypted JSON
