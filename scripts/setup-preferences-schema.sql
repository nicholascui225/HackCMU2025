-- Setup script for user preferences table
-- Run this in Supabase SQL editor (Project → SQL) to add the preferences table

-- User preferences table for AI event creation
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  preferences_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id) -- One preferences record per user
);

-- helpful indexes
create index if not exists idx_user_preferences_user on public.user_preferences(user_id);

-- RLS
alter table public.user_preferences enable row level security;

-- Only owner can read/write their preferences
drop policy if exists "user_preferences_select_own" on public.user_preferences;
create policy "user_preferences_select_own" on public.user_preferences
  for select using (user_id = auth.uid());

drop policy if exists "user_preferences_insert_own" on public.user_preferences;
create policy "user_preferences_insert_own" on public.user_preferences
  for insert with check (user_id = auth.uid());

drop policy if exists "user_preferences_update_own" on public.user_preferences;
create policy "user_preferences_update_own" on public.user_preferences
  for update using (user_id = auth.uid());

drop policy if exists "user_preferences_delete_own" on public.user_preferences;
create policy "user_preferences_delete_own" on public.user_preferences
  for delete using (user_id = auth.uid());

-- Auto-set user_id on insert
drop trigger if exists trg_set_user_id_preferences on public.user_preferences;
create trigger trg_set_user_id_preferences
  before insert on public.user_preferences
  for each row execute function public.set_auth_user_id();

-- Auto-update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists trg_update_user_preferences_updated_at on public.user_preferences;
create trigger trg_update_user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.update_updated_at_column();
