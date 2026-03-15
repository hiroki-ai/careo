-- OB/OG訪問ログテーブル
CREATE TABLE IF NOT EXISTS ob_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  company_name text NOT NULL,
  person_name text,
  visited_at date NOT NULL,
  purpose text NOT NULL DEFAULT 'ob_visit',
  insights text,
  impression text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ob_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own ob_visits"
  ON ob_visits FOR ALL
  USING (auth.uid() = user_id);

-- 筆記試験管理テーブル
CREATE TABLE IF NOT EXISTS aptitude_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  company_name text NOT NULL,
  test_type text NOT NULL DEFAULT 'SPI',
  test_date date,
  score_verbal integer,
  score_nonverbal integer,
  score_english integer,
  result text NOT NULL DEFAULT 'PENDING',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE aptitude_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own aptitude_tests"
  ON aptitude_tests FOR ALL
  USING (auth.uid() = user_id);

-- 幹部会議テーブル（Careo事業戦略AI会議）
CREATE TABLE IF NOT EXISTS board_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_index integer NOT NULL,
  topic_owner text NOT NULL,
  topic text NOT NULL,
  topic_owner_opening text NOT NULL,
  discussion jsonb NOT NULL DEFAULT '[]',
  conclusion text NOT NULL,
  recommended_action text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  created_at timestamptz DEFAULT now()
);

-- RLSは無効（事業戦略データはユーザー個人に紐づかない）
ALTER TABLE board_meetings DISABLE ROW LEVEL SECURITY;
