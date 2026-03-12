-- Companies
create table companies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  industry text,
  url text,
  status text not null default 'WISHLIST',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table companies enable row level security;
create policy "Users can only access own companies"
  on companies for all using (auth.uid() = user_id);

-- ES entries
create table es_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  company_id uuid references companies on delete cascade,
  title text not null,
  deadline timestamptz,
  status text not null default 'DRAFT',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table es_entries enable row level security;
create policy "Users can only access own es_entries"
  on es_entries for all using (auth.uid() = user_id);

-- ES questions
create table es_questions (
  id uuid default gen_random_uuid() primary key,
  es_id uuid references es_entries on delete cascade not null,
  question text default '',
  answer text default '',
  order_index integer default 0
);
alter table es_questions enable row level security;
create policy "Users can access es_questions via es_entries"
  on es_questions for all using (
    exists (
      select 1 from es_entries
      where es_entries.id = es_questions.es_id
        and es_entries.user_id = auth.uid()
    )
  );

-- Interviews
create table interviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  company_id uuid references companies on delete cascade,
  round integer not null default 1,
  scheduled_at timestamptz not null,
  interviewers text,
  notes text,
  result text not null default 'PENDING',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table interviews enable row level security;
create policy "Users can only access own interviews"
  on interviews for all using (auth.uid() = user_id);

-- Interview questions
create table interview_questions (
  id uuid default gen_random_uuid() primary key,
  interview_id uuid references interviews on delete cascade not null,
  question text default '',
  answer text default '',
  order_index integer default 0
);
alter table interview_questions enable row level security;
create policy "Users can access interview_questions via interviews"
  on interview_questions for all using (
    exists (
      select 1 from interviews
      where interviews.id = interview_questions.interview_id
        and interviews.user_id = auth.uid()
    )
  );

-- updated_at 自動更新
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger companies_updated_at before update on companies
  for each row execute function update_updated_at();
create trigger es_entries_updated_at before update on es_entries
  for each row execute function update_updated_at();
create trigger interviews_updated_at before update on interviews
  for each row execute function update_updated_at();
