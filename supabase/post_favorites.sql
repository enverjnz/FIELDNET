-- Favoriten für Beiträge (Bookmark / Stern)
CREATE TABLE IF NOT EXISTS public.post_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT post_favorites_post_id_user_id_key UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS post_favorites_post_id_idx ON public.post_favorites(post_id);
CREATE INDEX IF NOT EXISTS post_favorites_user_id_idx ON public.post_favorites(user_id);

ALTER TABLE public.post_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read post favorites"
  ON public.post_favorites FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can favorite posts"
  ON public.post_favorites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own favorites"
  ON public.post_favorites FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
