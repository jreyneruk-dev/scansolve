-- 015_account_deletion.sql
--
-- In-app account deletion (Apple 5.1.1(v), Google Play). A deleted member's
-- history must not block deleting their auth user: these references were
-- NO ACTION, so they now become NULL instead.

ALTER TABLE org_invites DROP CONSTRAINT IF EXISTS org_invites_invited_by_fkey;
ALTER TABLE org_invites
  ADD CONSTRAINT org_invites_invited_by_fkey
  FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_claimed_by_fkey;
ALTER TABLE locations
  ADD CONSTRAINT locations_claimed_by_fkey
  FOREIGN KEY (claimed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE label_print_jobs ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE label_print_jobs DROP CONSTRAINT IF EXISTS label_print_jobs_user_id_fkey;
ALTER TABLE label_print_jobs
  ADD CONSTRAINT label_print_jobs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
