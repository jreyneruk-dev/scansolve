-- 014_staff_issues.sql
--
-- Staff can log an issue without scanning a QR label, describing the location
-- in free text. Such issues have no location_id. Every issue must still say
-- where it is: a label location or a non-blank location_text.

ALTER TABLE issues ALTER COLUMN location_id DROP NOT NULL;

ALTER TABLE issues
  ADD COLUMN IF NOT EXISTS location_text TEXT CHECK (char_length(location_text) <= 200),
  ADD COLUMN IF NOT EXISTS created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE issues
  ADD CONSTRAINT issues_has_location
  CHECK (location_id IS NOT NULL OR length(trim(coalesce(location_text, ''))) > 0);
