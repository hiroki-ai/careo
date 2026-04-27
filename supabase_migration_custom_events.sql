-- カスタム予定（自由に書き込めるマイ予定）
-- 友人ヒアリング (2026-04-27): 紙のカレンダーで全部書き込んでいたユーザーへの代替

create table if not exists public.custom_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  scheduled_at timestamptz not null,
  end_at timestamptz,
  location text,
  notes text,
  color text default 'gray',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists custom_events_user_id_idx on public.custom_events(user_id);
create index if not exists custom_events_scheduled_at_idx on public.custom_events(scheduled_at);

alter table public.custom_events enable row level security;

drop policy if exists "custom_events_select" on public.custom_events;
create policy "custom_events_select" on public.custom_events for select using (auth.uid() = user_id);

drop policy if exists "custom_events_insert" on public.custom_events;
create policy "custom_events_insert" on public.custom_events for insert with check (auth.uid() = user_id);

drop policy if exists "custom_events_update" on public.custom_events;
create policy "custom_events_update" on public.custom_events for update using (auth.uid() = user_id);

drop policy if exists "custom_events_delete" on public.custom_events;
create policy "custom_events_delete" on public.custom_events for delete using (auth.uid() = user_id);
