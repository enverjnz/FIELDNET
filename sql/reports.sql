-- Report & Moderation System (Profile + Comments)
-- In Supabase SQL Editor ausführen.

create extension if not exists "pgcrypto";

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users (id) on delete set null,
  reported_type text not null
    check (reported_type in ('profile', 'comment', 'message')),
  target_id uuid not null,
  reason text not null
    check (reason in ('spam', 'harassment', 'inappropriate', 'other')),
  details text,
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists reports_status_created_at_idx
  on public.reports (status, created_at desc);

create index if not exists reports_target_idx
  on public.reports (reported_type, target_id);

create index if not exists reports_reporter_id_idx
  on public.reports (reporter_id);

comment on table public.reports is
  'User reports for profiles, comments and forum messages (App Store Guideline 1.2 / moderation).';

alter table public.reports enable row level security;

grant insert, select on public.reports to authenticated;

-- Authenticated users may create reports for themselves only.
drop policy if exists "Authenticated can insert own reports" on public.reports;
create policy "Authenticated can insert own reports"
  on public.reports
  for insert
  to authenticated
  with check (auth.uid() = reporter_id);

-- Needed so PostgREST can return the inserted row (.insert().select()).
-- Users may only see their own reports; admins use the service role.
drop policy if exists "Users can read own reports" on public.reports;
create policy "Users can read own reports"
  on public.reports
  for select
  to authenticated
  using (auth.uid() = reporter_id);

-- No UPDATE / DELETE for authenticated or anon.
-- Service role (Dashboard, admin tools, Edge Functions with service key)
-- bypasses RLS and can update/review reports.
