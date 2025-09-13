-- Run this in Supabase SQL editor (Project → SQL) to create tables and policies

-- Ensure pgcrypto is available for gen_random_uuid (usually enabled by default)
-- create extension if not exists pgcrypto;

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete cascade,
  title text not null,
  type text not null check (type in ('event','task','goal','sleep','eat','selfcare')),
  date date,
  start_time time,
  end_time time,
  completed boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

-- helpful indexes
create index if not exists idx_goals_user on public.goals(user_id);
create index if not exists idx_tasks_user on public.tasks(user_id);
create index if not exists idx_tasks_goal on public.tasks(goal_id);
create index if not exists idx_tasks_date on public.tasks(date);

-- RLS
alter table public.goals enable row level security;
alter table public.tasks enable row level security;

-- Only owner can read/write their rows (drop then create to be idempotent on re-run)
drop policy if exists "goals_select_own" on public.goals;
create policy "goals_select_own" on public.goals
  for select using (user_id = auth.uid());

drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own" on public.goals
  for insert with check (user_id = auth.uid());

drop policy if exists "goals_update_own" on public.goals;
create policy "goals_update_own" on public.goals
  for update using (user_id = auth.uid());

drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_delete_own" on public.goals
  for delete using (user_id = auth.uid());

drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks
  for select using (user_id = auth.uid());

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks
  for insert with check (
    user_id = auth.uid()
    and (goal_id is null or goal_id in (select id from public.goals where user_id = auth.uid()))
  );

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks
  for update using (user_id = auth.uid());

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks
  for delete using (user_id = auth.uid());

-- Optional: set user_id automatically on insert
create or replace function public.set_auth_user_id()
returns trigger language plpgsql security definer as $$
begin
  new.user_id := auth.uid();
  return new;
end; $$;

drop trigger if exists trg_set_user_id_goals on public.goals;
create trigger trg_set_user_id_goals
  before insert on public.goals
  for each row execute function public.set_auth_user_id();

drop trigger if exists trg_set_user_id_tasks on public.tasks;
create trigger trg_set_user_id_tasks
  before insert on public.tasks
  for each row execute function public.set_auth_user_id();

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


