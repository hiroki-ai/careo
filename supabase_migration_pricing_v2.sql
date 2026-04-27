-- =====================================================
-- Pricing v2 マイグレーション（2026-04-27）
--
-- 内容:
-- 1) pro_grants テーブル: 単発 Pro 付与の監査ログ + 1回限り制約
-- 2) summer_intern_deadlines テーブル（既存 supabase_migration_intern_deadlines.sql 同等）
--    ※ LP の /summer-intern が空表示になっていた問題の解消
--
-- 実行場所: Supabase Dashboard → SQL Editor
--   https://supabase.com/dashboard/project/lqjdozbdexzofekcqtfx/sql/new
-- =====================================================

-- ================================================================
-- 1. pro_grants（単発 Pro 期間付与の監査ログ）
-- ================================================================
CREATE TABLE IF NOT EXISTS pro_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grant_type text NOT NULL,           -- 'es_contribute' | 'public_profile' | 'pack_summer' | 'pack_senkou' | 'campaign'
  grant_days integer NOT NULL,        -- 付与日数
  granted_until timestamptz NOT NULL, -- 付与によって到達した plan_period_end
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, grant_type)        -- 同種付与は1ユーザー1回限り（pack 系は同 type 重複購入を防ぐ目的）
);

CREATE INDEX IF NOT EXISTS idx_pro_grants_user ON pro_grants (user_id);

ALTER TABLE pro_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own grants" ON pro_grants;
CREATE POLICY "Users read own grants" ON pro_grants
  FOR SELECT USING (auth.uid() = user_id);

-- 書き込みは service_role のみ（API 経由で applyProGrant() が制御）

-- ================================================================
-- 2. summer_intern_deadlines（LP /summer-intern 用）
-- ================================================================
CREATE TABLE IF NOT EXISTS summer_intern_deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  company_name text NOT NULL,
  industry text,
  deadline_display text NOT NULL,
  deadline_sort_key integer,
  note text,
  source_url text,
  confidence text NOT NULL DEFAULT 'estimated',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year, company_name)
);

CREATE INDEX IF NOT EXISTS idx_sid_year_sort ON summer_intern_deadlines (year, deadline_sort_key);
CREATE INDEX IF NOT EXISTS idx_sid_industry ON summer_intern_deadlines (year, industry);

ALTER TABLE summer_intern_deadlines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads deadlines" ON summer_intern_deadlines;
CREATE POLICY "Anyone reads deadlines" ON summer_intern_deadlines
  FOR SELECT USING (true);

-- 初期データ（2026年夏インターン）
INSERT INTO summer_intern_deadlines (year, company_name, industry, deadline_display, deadline_sort_key, confidence) VALUES
  (2026, 'マッキンゼー・アンド・カンパニー', '戦略コンサル', '5月上旬', 501, 'historical'),
  (2026, 'ボストン コンサルティング グループ', '戦略コンサル', '5月中旬', 502, 'historical'),
  (2026, 'ベイン・アンド・カンパニー', '戦略コンサル', '5月中旬', 502, 'historical'),
  (2026, 'アクセンチュア', '総合コンサル', '5月下旬', 503, 'historical'),
  (2026, 'PwCコンサルティング', '総合コンサル', '6月上旬', 601, 'historical'),
  (2026, 'デロイト トーマツ コンサルティング', '総合コンサル', '6月上旬', 601, 'historical'),
  (2026, 'ゴールドマン・サックス', '外資投資銀行', '5月中旬', 502, 'historical'),
  (2026, 'モルガン・スタンレー', '外資投資銀行', '5月中旬', 502, 'historical'),
  (2026, 'JPモルガン', '外資投資銀行', '5月下旬', 503, 'historical'),
  (2026, '三菱商事', '総合商社', '6月中旬', 602, 'historical'),
  (2026, '三井物産', '総合商社', '6月中旬', 602, 'historical'),
  (2026, '伊藤忠商事', '総合商社', '6月中旬', 602, 'historical'),
  (2026, '住友商事', '総合商社', '6月下旬', 603, 'historical'),
  (2026, '丸紅', '総合商社', '6月下旬', 603, 'historical'),
  (2026, '三菱UFJ銀行', '日系金融', '6月下旬', 603, 'historical'),
  (2026, '三井住友銀行', '日系金融', '6月下旬', 603, 'historical'),
  (2026, 'みずほフィナンシャルグループ', '日系金融', '7月上旬', 701, 'historical'),
  (2026, '野村證券', '日系金融', '6月下旬', 603, 'historical'),
  (2026, 'Google Japan', '外資IT', '5月中旬', 502, 'historical'),
  (2026, '楽天グループ', '国内IT', '6月下旬', 603, 'historical'),
  (2026, 'サイバーエージェント', '国内IT', '7月上旬', 701, 'historical'),
  (2026, 'DeNA', '国内IT', '7月中旬', 702, 'historical'),
  (2026, 'LINEヤフー', '国内IT', '7月中旬', 702, 'historical'),
  (2026, 'リクルート', 'HR・Web', '6月中旬', 602, 'historical'),
  (2026, 'メルカリ', '国内IT', '7月下旬', 703, 'historical'),
  (2026, 'ソニーグループ', '電機メーカー', '6月下旬', 603, 'historical'),
  (2026, 'パナソニック', '電機メーカー', '7月上旬', 701, 'historical'),
  (2026, 'トヨタ自動車', '自動車', '6月下旬', 603, 'historical'),
  (2026, 'ホンダ', '自動車', '6月下旬', 603, 'historical'),
  (2026, '味の素', '食品', '6月下旬', 603, 'historical'),
  (2026, '資生堂', '化粧品', '7月上旬', 701, 'historical'),
  (2026, '電通', '広告', '6月中旬', 602, 'historical'),
  (2026, '博報堂', '広告', '6月中旬', 602, 'historical'),
  (2026, 'フジテレビジョン', 'テレビ', '6月上旬', 601, 'historical'),
  (2026, '日本テレビ放送網', 'テレビ', '6月上旬', 601, 'historical'),
  (2026, '三菱地所', '不動産', '6月下旬', 603, 'historical'),
  (2026, '三井不動産', '不動産', '6月下旬', 603, 'historical')
ON CONFLICT (year, company_name) DO NOTHING;
