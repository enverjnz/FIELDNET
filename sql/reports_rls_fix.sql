-- Fix: "new row violates row-level security policy" beim Absenden einer Meldung.
-- Ursache: INSERT + .select() braucht eine SELECT-Policy für die eigene Zeile.
-- In Supabase SQL Editor ausführen, falls reports.sql schon ohne SELECT-Policy lief.

grant insert, select on public.reports to authenticated;

drop policy if exists "Users can read own reports" on public.reports;
create policy "Users can read own reports"
  on public.reports
  for select
  to authenticated
  using (auth.uid() = reporter_id);
