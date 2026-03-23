-- push_subscriptions テーブル作成
-- Supabase ダッシュボード > SQL Editor にコピペして実行してください

create table if not exists push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS 有効化
alter table push_subscriptions enable row level security;

-- ユーザーは自分の購読のみ操作可能
create policy "Users can manage own push subscriptions"
  on push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
