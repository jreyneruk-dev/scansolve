-- ============================================================
-- 004: Label printing — org numbers, UID sequences, print jobs
-- ============================================================

-- Sequence for short numeric org identifiers, starting at 1001
CREATE SEQUENCE IF NOT EXISTS org_number_seq START 1001;

-- Add org_number to organizations (auto-assigned, globally unique short int)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS org_number INT UNIQUE DEFAULT nextval('org_number_seq');

-- Backfill any existing orgs that got NULL (shouldn't happen with DEFAULT but just in case)
UPDATE organizations
SET org_number = nextval('org_number_seq')
WHERE org_number IS NULL;

-- Make it NOT NULL now that all rows are populated
ALTER TABLE organizations
  ALTER COLUMN org_number SET NOT NULL;

-- ============================================================
-- Fix locations.uid unique constraint to be per-org, not global
-- (UIDs are now only unique within an organisation)
-- ============================================================
ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_uid_key;
ALTER TABLE locations ADD CONSTRAINT locations_uid_org_unique UNIQUE (org_id, uid);

-- ============================================================
-- Per-org UID sequence counter
-- ============================================================
CREATE TABLE IF NOT EXISTS uid_sequence (
  org_id                UUID    PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  last_sequence_number  BIGINT  NOT NULL DEFAULT 0
);

ALTER TABLE uid_sequence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_manage_uid_sequence" ON uid_sequence
  USING  (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- ============================================================
-- Label print job history
-- ============================================================
CREATE TABLE IF NOT EXISTS label_print_jobs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users(id),
  sheet_type       TEXT        NOT NULL DEFAULT 'avery_l7165',
  sheets           INT         NOT NULL,
  quantity_labels  INT         NOT NULL,
  uid_start        TEXT        NOT NULL,
  uid_end          TEXT        NOT NULL,
  printed_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE label_print_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_manage_print_jobs" ON label_print_jobs
  USING  (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- ============================================================
-- Atomic UID reservation function
-- Inserts/updates uid_sequence row under a row-level lock,
-- returns the start and end sequence numbers reserved.
-- ============================================================
CREATE OR REPLACE FUNCTION reserve_label_uids(p_org_id UUID, p_count INT)
RETURNS TABLE(seq_start BIGINT, seq_end BIGINT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_start BIGINT;
  v_end   BIGINT;
BEGIN
  -- Ensure a row exists for this org, then lock it
  INSERT INTO uid_sequence (org_id, last_sequence_number)
  VALUES (p_org_id, 0)
  ON CONFLICT (org_id) DO NOTHING;

  UPDATE uid_sequence
  SET last_sequence_number = last_sequence_number + p_count
  WHERE org_id = p_org_id
  RETURNING
    last_sequence_number - p_count + 1,
    last_sequence_number
  INTO v_start, v_end;

  seq_start := v_start;
  seq_end   := v_end;
  RETURN NEXT;
END;
$$;
