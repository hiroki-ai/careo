-- ブログ週次スケジュール管理テーブル
-- ロードマップサイトから1週間分のブログテーマを管理するために使用
-- status: 'planned' = 予定、'published' = 投稿済み、'skipped' = スキップ

create table if not exists blog_schedule (
  id uuid default gen_random_uuid() primary key,
  scheduled_date date not null unique,
  theme text not null,
  keyword text,
  hint text,
  status text not null default 'planned',
  published_slug text,
  created_at timestamptz default now()
);

-- RLS: 誰でも読める、書き込みはservice roleのみ
alter table blog_schedule enable row level security;

create policy "anyone can read blog_schedule"
  on blog_schedule for select using (true);
