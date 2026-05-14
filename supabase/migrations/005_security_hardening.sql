-- ============================================================
-- 005: Security hardening
--
-- Fixes two medium-severity issues found in security audit:
--
-- 1. SECURITY DEFINER functions lacked SET search_path = ''
--    which makes them vulnerable to search-path injection.
--    Both functions are recreated with the safe search_path.
--
-- 2. org_members and org_invites had RLS enabled but only
--    SELECT policies. INSERT/UPDATE/DELETE were unguarded,
--    relying solely on the service_role key not leaking.
--    Explicit DENY-by-default policies are added for defence
--    in depth (all mutations still go via service_role in app).
-- ============================================================


-- ── 1. Fix SECURITY DEFINER functions ────────────────────────────────────

-- get_user_org_id: looked up org by owner, used in RLS helpers.
-- Now runs with an empty search_path so no schema injection is possible.
CREATE OR REPLACE FUNCTION get_user_org_id(user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id FROM public.organizations WHERE owner_id = user_id LIMIT 1;
$$;

-- reserve_label_uids: atomic UID block reservation (called via service role).
CREATE OR REPLACE FUNCTION reserve_label_uids(p_org_id UUID, p_count INT)
RETURNS TABLE(seq_start BIGINT, seq_end BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_start BIGINT;
  v_end   BIGINT;
BEGIN
  INSERT INTO public.uid_sequence (org_id, last_sequence_number)
  VALUES (p_org_id, 0)
  ON CONFLICT (org_id) DO NOTHING;

  UPDATE public.uid_sequence
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


-- ── 2. RLS policies for org_members ──────────────────────────────────────
-- The app only mutates these tables via the service_role key (which bypasses
-- RLS). These policies ensure that even if the anon/authenticated role is
-- somehow used for writes, they are blocked.

-- Block direct INSERT by non-service roles
CREATE POLICY "block_direct_insert_members" ON org_members
  FOR INSERT TO authenticated, anon
  WITH CHECK (false);

-- Block direct UPDATE by non-service roles
CREATE POLICY "block_direct_update_members" ON org_members
  FOR UPDATE TO authenticated, anon
  USING (false);

-- Block direct DELETE by non-service roles
CREATE POLICY "block_direct_delete_members" ON org_members
  FOR DELETE TO authenticated, anon
  USING (false);


-- ── 3. RLS policies for org_invites ──────────────────────────────────────

-- Block direct INSERT by non-service roles
CREATE POLICY "block_direct_insert_invites" ON org_invites
  FOR INSERT TO authenticated, anon
  WITH CHECK (false);

-- Block direct UPDATE by non-service roles (accept flow uses service_role)
CREATE POLICY "block_direct_update_invites" ON org_invites
  FOR UPDATE TO authenticated, anon
  USING (false);

-- Block direct DELETE by non-service roles
CREATE POLICY "block_direct_delete_invites" ON org_invites
  FOR DELETE TO authenticated, anon
  USING (false);
