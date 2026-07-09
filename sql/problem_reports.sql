-- Problem reports from the app sidebar ("Problem melden")
CREATE TABLE IF NOT EXISTS public.problem_reports (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category   text NOT NULL,
  message    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS problem_reports_created_at_idx
  ON public.problem_reports (created_at DESC);

ALTER TABLE public.problem_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can insert own problem reports"
  ON public.problem_reports FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own problem reports"
  ON public.problem_reports FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Edge Function (nur E-Mail-Versand — Speichern passiert in der App):
-- supabase functions deploy send-problem-report
-- Secrets: RESEND_API_KEY, REPORT_TO_EMAIL, REPORT_FROM_EMAIL
