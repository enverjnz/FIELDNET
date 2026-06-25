-- GDPR: anonymous deletion feedback (no user_id)
CREATE TABLE IF NOT EXISTS public.delete_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reason TEXT NOT NULL,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.delete_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_insert_delete_profiles"
  ON public.delete_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Self-service account deletion (removes auth.users → cascades to profiles)
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
