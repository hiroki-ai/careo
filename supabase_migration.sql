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

-- =====================================================
-- 卒業年別インサイトRPC
-- Supabase SQL Editor で実行すること
-- =====================================================
CREATE OR REPLACE FUNCTION get_insights_by_graduation_year(p_graduation_year INT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', COUNT(DISTINCT up.id),
    'avg_companies_per_user', ROUND(COALESCE(AVG(comp_counts.cnt), 0)::numeric, 1),
    'offer_rate', ROUND(COALESCE(
      SUM(CASE WHEN comp_counts.offered > 0 THEN 1.0 ELSE 0.0 END) /
      NULLIF(COUNT(DISTINCT up.id), 0),
      0
    )::numeric, 2),
    'avg_interviews_before_offer', ROUND(COALESCE(AVG(interview_counts.cnt), 0)::numeric, 1),
    'top_industries', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT c.industry, COUNT(*) AS count
        FROM companies c
        JOIN user_profiles up2 ON c.user_id = up2.id
        WHERE up2.graduation_year = p_graduation_year
          AND c.industry IS NOT NULL AND c.industry != ''
          AND c.status != 'WISHLIST'
        GROUP BY c.industry
        ORDER BY count DESC
        LIMIT 5
      ) t
    )
  ) INTO result
  FROM user_profiles up
  LEFT JOIN (
    SELECT user_id,
           COUNT(*) AS cnt,
           SUM(CASE WHEN status = 'OFFERED' THEN 1 ELSE 0 END) AS offered
    FROM companies
    WHERE status != 'WISHLIST'
    GROUP BY user_id
  ) comp_counts ON comp_counts.user_id = up.id
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS cnt
    FROM interviews
    GROUP BY user_id
  ) interview_counts ON interview_counts.user_id = up.id
  WHERE up.graduation_year = p_graduation_year;

  RETURN result;
END;
$$;


-- 2026-03-18: companies テーブルに is_intern_offer カラムを追加
-- OFFERED ステータスのときにユーザーが「インターン合格」か「内定（本選考）」かを選択できるようにする
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_intern_offer BOOLEAN DEFAULT NULL;

-- LP動的コピー設定テーブル
CREATE TABLE IF NOT EXISTS lp_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lp_settings DISABLE ROW LEVEL SECURITY;

INSERT INTO lp_settings (key, value) VALUES
  ('hero_subtext',  'AIコーチ「カレオ」があなたの選考状況・自己分析・OB訪問・面接メモを全部把握。\n話すだけで自己分析が育ち、就活データが自動で蓄積される。'),
  ('after_items',   '["企業・ES・面接・OB訪問・締切がすべて一か所。全体像が常に見える","締切3日前に自動通知。見落としゼロ","カレオと話すだけで自己分析・企業リストが自動で更新される","毎週AIがPDCAを自動分析。来週やるべきことが即わかる","自己分析を一度入力すればAIが毎回ES文章を生成"]'),
  ('badge_text',    '28卒向け・AI就活コーチ「カレオ」')
ON CONFLICT (key) DO NOTHING;

-- 2026-03-18: AIチームメンバーのタスクレポートテーブル
CREATE TABLE IF NOT EXISTS team_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id TEXT NOT NULL,
  member_name TEXT NOT NULL,
  task_type TEXT NOT NULL,
  headline TEXT NOT NULL,
  body TEXT NOT NULL,
  deliverable TEXT NOT NULL,
  action_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE team_reports DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS team_reports_member_id_idx ON team_reports(member_id);
CREATE INDEX IF NOT EXISTS team_reports_created_at_idx ON team_reports(created_at DESC);

-- 2026-04-06: ブログ週次スケジュール管理テーブル
-- ロードマップサイトから1週間分のブログテーマを管理するために使用
-- status: 'planned' = 予定、'published' = 投稿済み、'skipped' = スキップ
CREATE TABLE IF NOT EXISTS blog_schedule (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_date date NOT NULL UNIQUE,
  theme text NOT NULL,
  keyword text,
  hint text,
  status text NOT NULL DEFAULT 'planned',
  published_slug text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE blog_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read blog_schedule"
  ON blog_schedule FOR SELECT USING (true);

-- X（Twitter）投稿ログ（サービスロールのみアクセス）
CREATE TABLE IF NOT EXISTS x_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tweet_id text NOT NULL UNIQUE,
  text text NOT NULL,
  pillar text NOT NULL,          -- info / empathy / question / careo / trend
  url text NOT NULL,
  posted_at timestamptz DEFAULT now()
);

ALTER TABLE x_posts ENABLE ROW LEVEL SECURITY;
-- アクセスはサービスロールのみ（RLSポリシーなし = 全員拒否）
