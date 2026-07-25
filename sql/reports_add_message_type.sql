-- Erweitert reported_type um Forum-Nachrichten ('message').
-- In Supabase SQL Editor ausführen, falls reports.sql schon ohne 'message' lief.

alter table public.reports
  drop constraint if exists reports_reported_type_check;

alter table public.reports
  add constraint reports_reported_type_check
  check (reported_type in ('profile', 'comment', 'message'));
