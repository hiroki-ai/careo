-- ブログ投稿テーブル
-- Vercel Cron（毎朝8時JST）でClaudeが自動生成・保存する

create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,          -- metaディスクリプション（120〜160文字）
  body text not null,                  -- HTML文字列（Claudeが生成）
  tags text[] not null default '{}',   -- タグ（例: ["ES対策", "自己分析"]）
  reading_time_min int not null default 5,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 公開インデックス（最新順）
create index if not exists blog_posts_published_at_idx on blog_posts (published_at desc);
-- slug検索
create index if not exists blog_posts_slug_idx on blog_posts (slug);

-- RLS: 全員が読める（未ログインユーザーも含む）
alter table blog_posts enable row level security;

create policy "blog_posts: anyone can read"
  on blog_posts for select
  using (true);

-- cronはservice_roleで書き込むのでINSERT/UPDATEポリシー不要
