-- =====================================================
-- サマーインターン締切カレンダー（毎週月曜自動更新）
-- 実行場所: Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS summer_intern_deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,                -- 募集年（2026など）
  company_name text NOT NULL,
  industry text,                        -- 業界ラベル
  deadline_display text NOT NULL,       -- "5月中旬" 等の表示用
  deadline_sort_key integer,            -- ソート用（"5月上旬"=501, "5月中旬"=502, "5月下旬"=503, "6月上旬"=601 等）
  note text,
  source_url text,                      -- 参考URL
  confidence text NOT NULL DEFAULT 'estimated', -- 'verified' | 'estimated' | 'historical'
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year, company_name)
);

CREATE INDEX IF NOT EXISTS idx_sid_year_sort ON summer_intern_deadlines (year, deadline_sort_key);
CREATE INDEX IF NOT EXISTS idx_sid_industry ON summer_intern_deadlines (year, industry);

-- 公開APIから読めるように、全員が読めるRLS（書き込みはservice_roleのみ）
ALTER TABLE summer_intern_deadlines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads deadlines" ON summer_intern_deadlines;
CREATE POLICY "Anyone reads deadlines" ON summer_intern_deadlines
  FOR SELECT USING (true);

-- 初期データ（cronが走るまで空だと格好悪いので、既存のseedを入れておく）
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
