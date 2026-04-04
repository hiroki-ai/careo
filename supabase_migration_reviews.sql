-- user_reviews: ユーザーが投稿したLPの利用者の声
create table if not exists user_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  rating int not null check (rating between 1 and 5),
  quote text not null check (char_length(quote) between 10 and 300),
  display_name text not null, -- "M.T." など匿名表示名
  university text,            -- "早稲田大学 · 就活生" など任意
  is_approved boolean not null default false,
  created_at timestamp with time zone not null default now()
);

alter table user_reviews enable row level security;

-- ユーザーは自分のレビューを投稿できる（1人1件）
create policy "Users can insert own review"
  on user_reviews for insert
  with check (auth.uid() = user_id);

-- ユーザーは自分のレビューを読める
create policy "Users can read own review"
  on user_reviews for select
  using (auth.uid() = user_id);

-- 承認済みレビューは誰でも読める（サービスロールはRLS無視）
create policy "Public can read approved reviews"
  on user_reviews for select
  using (is_approved = true);
