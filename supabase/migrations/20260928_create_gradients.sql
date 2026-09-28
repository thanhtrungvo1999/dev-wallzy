-- Wallzy custom gradients
-- Run this migration in the Supabase SQL Editor.

create table if not exists public.gradients (
  user_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.gradients enable row level security;

drop policy if exists "Users can read own gradients" on public.gradients;
create policy "Users can read own gradients"
on public.gradients for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own gradients" on public.gradients;
create policy "Users can insert own gradients"
on public.gradients for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own gradients" on public.gradients;
create policy "Users can update own gradients"
on public.gradients for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
