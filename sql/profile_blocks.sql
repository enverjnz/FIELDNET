-- User-Blocking (App Store Guideline 1.2)
-- In Supabase SQL Editor ausführen.

create extension if not exists "pgcrypto";

create table if not exists public.profile_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint profile_blocks_no_self check (blocker_id <> blocked_id),
  constraint profile_blocks_unique unique (blocker_id, blocked_id)
);

create index if not exists profile_blocks_blocker_id_idx
  on public.profile_blocks (blocker_id);

create index if not exists profile_blocks_blocked_id_idx
  on public.profile_blocks (blocked_id);

comment on table public.profile_blocks is
  'User blocks: blocker_id has blocked blocked_id.';

alter table public.profile_blocks enable row level security;

grant select, insert, delete on public.profile_blocks to authenticated;

drop policy if exists "Users can read own blocks" on public.profile_blocks;
create policy "Users can read own blocks"
  on public.profile_blocks
  for select
  to authenticated
  using (auth.uid() = blocker_id or auth.uid() = blocked_id);

drop policy if exists "Users can insert own blocks" on public.profile_blocks;
create policy "Users can insert own blocks"
  on public.profile_blocks
  for insert
  to authenticated
  with check (auth.uid() = blocker_id);

drop policy if exists "Users can delete own blocks" on public.profile_blocks;
create policy "Users can delete own blocks"
  on public.profile_blocks
  for delete
  to authenticated
  using (auth.uid() = blocker_id);
