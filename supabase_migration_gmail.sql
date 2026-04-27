-- Gmail連携 (Coming Soon)
-- 友人ヒアリング (2026-04-27): 「企業からのメールを企業ごとに管理して、次の行動を提案してほしい」

-- 1. OAuthトークン管理
create table if not exists public.gmail_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  access_token text,
  refresh_token text not null,
  token_expires_at timestamptz,
  scopes text[] default array['https://www.googleapis.com/auth/gmail.readonly']::text[],
  is_active boolean default true,
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.gmail_credentials enable row level security;
drop policy if exists "gmail_credentials_owner" on public.gmail_credentials;
create policy "gmail_credentials_owner" on public.gmail_credentials
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. 同期されたメールスレッド
create table if not exists public.email_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  gmail_thread_id text not null,
  company_id uuid references public.companies(id) on delete set null,
  matched_company_name text,        -- AIマッチング結果（companyId付与前のヒント）
  subject text,
  from_address text,
  from_domain text,
  snippet text,
  body_excerpt text,                -- 最大2000文字の抜粋
  received_at timestamptz,
  message_count int default 1,
  last_action_suggestion text,      -- AIが生成した次のアクション提案
  is_actionable boolean default false,  -- 返信/対応が必要かのフラグ
  is_archived boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, gmail_thread_id)
);

create index if not exists email_threads_user_company_idx on public.email_threads(user_id, company_id);
create index if not exists email_threads_received_idx on public.email_threads(received_at desc);
create index if not exists email_threads_actionable_idx on public.email_threads(user_id, is_actionable) where is_actionable = true;

alter table public.email_threads enable row level security;
drop policy if exists "email_threads_owner" on public.email_threads;
create policy "email_threads_owner" on public.email_threads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. 企業ドメインマッピング（学習）
create table if not exists public.company_domain_hints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  domain text not null,             -- 例: "rikunabi.com", "example-corp.co.jp"
  hint_source text default 'manual',-- 'manual' | 'ai' | 'user_confirmed'
  created_at timestamptz default now(),
  unique (user_id, domain, company_id)
);

create index if not exists domain_hints_user_domain_idx on public.company_domain_hints(user_id, domain);

alter table public.company_domain_hints enable row level security;
drop policy if exists "company_domain_hints_owner" on public.company_domain_hints;
create policy "company_domain_hints_owner" on public.company_domain_hints
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
