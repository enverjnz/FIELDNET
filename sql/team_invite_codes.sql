-- Per-Verein invoice codes: 1 code unlocks creation of exactly 1 team.
-- Run in Supabase SQL editor if the table/columns do not exist yet.

CREATE TABLE IF NOT EXISTS public.team_invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  is_used boolean NOT NULL DEFAULT false,
  used_by_user_id uuid REFERENCES public.profiles(id),
  team_id uuid REFERENCES public.teams(id),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.team_invite_codes
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id);

ALTER TABLE public.team_invite_codes
  ADD COLUMN IF NOT EXISTS used_by_user_id uuid REFERENCES public.profiles(id);

-- Coaches can read codes they redeemed (for retry after failed wizard).
CREATE POLICY IF NOT EXISTS "Coach reads own redeemed code"
  ON public.team_invite_codes FOR SELECT
  TO authenticated
  USING (used_by_user_id = auth.uid());

-- Authenticated users can validate + redeem unused codes.
CREATE POLICY IF NOT EXISTS "Coach redeems unused invite code"
  ON public.team_invite_codes FOR UPDATE
  TO authenticated
  USING (used_by_user_id IS NULL OR used_by_user_id = auth.uid())
  WITH CHECK (used_by_user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Anyone reads code by string for validation"
  ON public.team_invite_codes FOR SELECT
  TO authenticated
  USING (true);
