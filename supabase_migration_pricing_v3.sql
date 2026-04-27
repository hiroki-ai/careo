-- =====================================================
-- Summer Intern v3 マイグレーション（2026-04-27）
--
-- 内容:
-- 1) summer_intern_deadlines にプロバイダ情報カラム追加（マイナビ・キャリタス等への外部リンク）
-- 2) joint_events テーブル: 合同説明会・業界研究セミナー等のイベント情報
-- 3) 追加企業 seed（28卒の主要採用企業 約60社 → 約100社へ拡張）
-- 4) 合同説明会 seed（マイナビEXPO・キャリタス就活フォーラム等）
--
-- 実行場所: Supabase Dashboard → SQL Editor
--   https://supabase.com/dashboard/project/lqjdozbdexzofekcqtfx/sql/new
-- =====================================================

-- ================================================================
-- 1. summer_intern_deadlines にプロバイダ情報追加
-- ================================================================
ALTER TABLE summer_intern_deadlines
  ADD COLUMN IF NOT EXISTS provider text,             -- 'mynavi' | 'careertasu' | 'rikunabi' | 'onecareer' | 'gaishishukatsu' | 'official'
  ADD COLUMN IF NOT EXISTS provider_url text;         -- 検索/エントリーページURL

-- ================================================================
-- 2. joint_events（合同説明会・業界研究セミナー）
-- ================================================================
CREATE TABLE IF NOT EXISTS joint_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  title text NOT NULL,                  -- "マイナビEXPO 大阪会場" など
  organizer text NOT NULL,              -- "マイナビ", "キャリタス就活", "ONE CAREER" 等
  category text,                        -- "合同説明会" | "業界研究" | "オンラインセミナー" | "選考対策"
  start_date date NOT NULL,
  end_date date,                        -- 複数日開催の場合
  location text,                        -- "東京ビッグサイト" / "オンライン" 等
  target_industries text[],             -- ['IT', '金融', '商社']
  registration_url text,                -- マイナビ等の登録URL
  provider text,                        -- 'mynavi' | 'careertasu' | 'onecareer' | 'rikunabi' | 'gaishishukatsu'
  note text,
  confidence text NOT NULL DEFAULT 'estimated',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_joint_events_year_date ON joint_events (year, start_date);
CREATE INDEX IF NOT EXISTS idx_joint_events_organizer ON joint_events (year, organizer);

ALTER TABLE joint_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads joint_events" ON joint_events;
CREATE POLICY "Anyone reads joint_events" ON joint_events
  FOR SELECT USING (true);

-- ================================================================
-- 3. 既存企業にプロバイダ情報を埋める（マイナビ28卒検索ページ）
-- ================================================================
UPDATE summer_intern_deadlines
SET provider = 'mynavi',
    provider_url = 'https://job.mynavi.jp/28/pub/?srch=&srKey=' || replace(company_name, ' ', '')
WHERE year = 2026 AND provider IS NULL;

-- ================================================================
-- 4. 追加企業 seed（締切が近い順を意識して幅広く）
-- ================================================================
INSERT INTO summer_intern_deadlines (year, company_name, industry, deadline_display, deadline_sort_key, confidence, provider, provider_url) VALUES
  -- 戦略コンサル追加
  (2026, 'A.T.カーニー', '戦略コンサル', '5月中旬', 502, 'historical', 'gaishishukatsu', 'https://gaishishukatsu.com/'),
  (2026, 'ローランド・ベルガー', '戦略コンサル', '5月下旬', 503, 'historical', 'gaishishukatsu', 'https://gaishishukatsu.com/'),
  (2026, 'アーサー・D・リトル', '戦略コンサル', '5月下旬', 503, 'historical', 'gaishishukatsu', 'https://gaishishukatsu.com/'),
  -- IT・SaaS
  (2026, 'SmartHR', 'SaaS', '6月上旬', 601, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=SmartHR'),
  (2026, 'freee', 'SaaS', '6月上旬', 601, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=freee'),
  (2026, 'マネーフォワード', 'SaaS', '6月中旬', 602, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=マネーフォワード'),
  (2026, 'Sansan', 'SaaS', '6月中旬', 602, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=Sansan'),
  (2026, 'NTTデータ', 'SIer・IT', '6月上旬', 601, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=NTTデータ'),
  (2026, '日本IBM', '外資IT', '5月下旬', 503, 'historical', 'gaishishukatsu', 'https://gaishishukatsu.com/'),
  (2026, 'マイクロソフト', '外資IT', '5月中旬', 502, 'historical', 'gaishishukatsu', 'https://gaishishukatsu.com/'),
  (2026, 'Amazon Japan', '外資IT', '5月中旬', 502, 'historical', 'gaishishukatsu', 'https://gaishishukatsu.com/'),
  -- 投資銀行・外資金融追加
  (2026, 'バークレイズ', '外資投資銀行', '5月中旬', 502, 'historical', 'gaishishukatsu', 'https://gaishishukatsu.com/'),
  (2026, 'UBS', '外資投資銀行', '5月下旬', 503, 'historical', 'gaishishukatsu', 'https://gaishishukatsu.com/'),
  (2026, 'ドイツ銀行', '外資投資銀行', '5月下旬', 503, 'historical', 'gaishishukatsu', 'https://gaishishukatsu.com/'),
  -- 国内金融追加
  (2026, '大和証券', '日系金融', '6月下旬', 603, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=大和証券'),
  (2026, 'SMBC日興証券', '日系金融', '6月下旬', 603, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=SMBC日興証券'),
  (2026, '東京海上日動火災保険', '日系金融', '6月下旬', 603, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=東京海上日動'),
  (2026, '損保ジャパン', '日系金融', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=損保ジャパン'),
  (2026, '日本生命', '日系金融', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=日本生命'),
  (2026, '第一生命', '日系金融', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=第一生命'),
  -- 商社追加
  (2026, '双日', '総合商社', '6月下旬', 603, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=双日'),
  (2026, '豊田通商', '総合商社', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=豊田通商'),
  -- メーカー追加
  (2026, 'キーエンス', '電機メーカー', '6月中旬', 602, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=キーエンス'),
  (2026, 'ファナック', '電機メーカー', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=ファナック'),
  (2026, '村田製作所', '電子部品', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=村田製作所'),
  (2026, '日立製作所', '電機メーカー', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=日立製作所'),
  (2026, '三菱重工業', '重工業', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=三菱重工'),
  (2026, '川崎重工業', '重工業', '7月中旬', 702, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=川崎重工'),
  (2026, 'デンソー', '自動車部品', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=デンソー'),
  -- 製薬
  (2026, '武田薬品工業', '製薬', '6月下旬', 603, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=武田薬品'),
  (2026, '第一三共', '製薬', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=第一三共'),
  (2026, 'アステラス製薬', '製薬', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=アステラス製薬'),
  -- 食品
  (2026, '明治', '食品', '6月下旬', 603, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=明治'),
  (2026, 'アサヒビール', '食品', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=アサヒビール'),
  (2026, 'キリン', '食品', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=キリン'),
  (2026, 'サントリーホールディングス', '食品', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=サントリー'),
  (2026, '日清食品', '食品', '7月中旬', 702, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=日清食品'),
  -- 化学・素材
  (2026, '旭化成', '化学', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=旭化成'),
  (2026, '三菱ケミカル', '化学', '7月中旬', 702, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=三菱ケミカル'),
  (2026, '日本製鉄', '鉄鋼', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=日本製鉄'),
  (2026, 'JFEスチール', '鉄鋼', '7月中旬', 702, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=JFEスチール'),
  -- アパレル・小売
  (2026, 'ファーストリテイリング', '小売', '6月中旬', 602, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=ファーストリテイリング'),
  (2026, 'ニトリ', '小売', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=ニトリ'),
  -- 印刷・紙
  (2026, '大日本印刷', '印刷', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=大日本印刷'),
  (2026, 'TOPPAN', '印刷', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=TOPPAN'),
  -- インフラ
  (2026, 'JR東日本', 'インフラ', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=JR東日本'),
  (2026, 'JR東海', 'インフラ', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=JR東海'),
  (2026, 'NTTドコモ', '通信', '6月下旬', 603, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=NTTドコモ'),
  (2026, 'ソフトバンク', '通信', '6月下旬', 603, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=ソフトバンク'),
  (2026, 'KDDI', '通信', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=KDDI'),
  -- 広告・メディア追加
  (2026, 'テレビ朝日', 'テレビ', '6月上旬', 601, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=テレビ朝日'),
  (2026, 'TBSテレビ', 'テレビ', '6月上旬', 601, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=TBSテレビ'),
  (2026, 'NHK', 'テレビ', '6月中旬', 602, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=NHK'),
  -- 不動産・建設
  (2026, '住友不動産', '不動産', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=住友不動産'),
  (2026, '東京建物', '不動産', '7月中旬', 702, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=東京建物'),
  (2026, '大林組', '建設', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=大林組'),
  (2026, '清水建設', '建設', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=清水建設'),
  -- ゲーム
  (2026, '任天堂', 'ゲーム', '6月下旬', 603, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=任天堂'),
  (2026, 'バンダイナムコエンターテインメント', 'ゲーム', '7月上旬', 701, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=バンダイナムコ'),
  (2026, 'スクウェア・エニックス', 'ゲーム', '7月中旬', 702, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=スクウェア・エニックス'),
  -- HR・人材
  (2026, 'パーソルキャリア', 'HR・Web', '6月中旬', 602, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=パーソル'),
  (2026, 'ビズリーチ', 'HR・Web', '6月下旬', 603, 'historical', 'mynavi', 'https://job.mynavi.jp/28/pub/?srch=ビズリーチ')
ON CONFLICT (year, company_name) DO UPDATE SET
  provider = EXCLUDED.provider,
  provider_url = EXCLUDED.provider_url;

-- ================================================================
-- 5. 合同説明会・イベント seed（マイナビ・キャリタス就活・ONE CAREER）
-- ================================================================
INSERT INTO joint_events (year, title, organizer, category, start_date, end_date, location, target_industries, registration_url, provider, confidence) VALUES
  (2026, 'マイナビ就職EXPO 東京会場', 'マイナビ', '合同説明会', '2026-05-17', '2026-05-18', '東京ビッグサイト', ARRAY['総合', '商社', '金融', 'IT'], 'https://job.mynavi.jp/conts/2027/expo/', 'mynavi', 'estimated'),
  (2026, 'マイナビ就職EXPO 大阪会場', 'マイナビ', '合同説明会', '2026-05-24', NULL, 'インテックス大阪', ARRAY['総合'], 'https://job.mynavi.jp/conts/2027/expo/', 'mynavi', 'estimated'),
  (2026, 'マイナビ業界研究セミナー（IT編）', 'マイナビ', '業界研究', '2026-06-07', NULL, 'オンライン', ARRAY['IT', 'SaaS'], 'https://job.mynavi.jp/conts/2027/seminar/', 'mynavi', 'estimated'),
  (2026, 'キャリタス就活フォーラム 東京', 'キャリタス就活', '合同説明会', '2026-05-31', NULL, '東京国際フォーラム', ARRAY['総合'], 'https://job.career-tasu.jp/2027/event/', 'careertasu', 'estimated'),
  (2026, 'キャリタス就活 業界研究LIVE', 'キャリタス就活', '業界研究', '2026-06-14', NULL, 'オンライン', ARRAY['総合'], 'https://job.career-tasu.jp/2027/event/', 'careertasu', 'estimated'),
  (2026, 'ONE CAREER SUPER LIVE', 'ONE CAREER', '合同説明会', '2026-06-08', NULL, 'オンライン', ARRAY['コンサル', '商社', '外資', 'IT'], 'https://www.onecareer.jp/events/', 'onecareer', 'estimated'),
  (2026, 'ONE CAREER 業界研究セミナー', 'ONE CAREER', '業界研究', '2026-06-21', NULL, 'オンライン', ARRAY['総合'], 'https://www.onecareer.jp/events/', 'onecareer', 'estimated'),
  (2026, '外資就活ドットコム 戦略コンサル特集', '外資就活ドットコム', '業界研究', '2026-05-10', NULL, 'オンライン', ARRAY['戦略コンサル', '外資金融'], 'https://gaishishukatsu.com/events/', 'gaishishukatsu', 'estimated'),
  (2026, '外資就活ドットコム 投資銀行特集', '外資就活ドットコム', '業界研究', '2026-05-15', NULL, 'オンライン', ARRAY['外資投資銀行'], 'https://gaishishukatsu.com/events/', 'gaishishukatsu', 'estimated'),
  (2026, 'リクナビ オンライン業界研究WEEK', 'リクナビ', '業界研究', '2026-06-01', '2026-06-07', 'オンライン', ARRAY['総合'], 'https://job.rikunabi.com/2027/event/', 'rikunabi', 'estimated'),
  (2026, 'マイナビ就職EXPO 名古屋会場', 'マイナビ', '合同説明会', '2026-05-31', NULL, 'ポートメッセなごや', ARRAY['総合', '製造'], 'https://job.mynavi.jp/conts/2027/expo/', 'mynavi', 'estimated'),
  (2026, 'マイナビ就職EXPO 福岡会場', 'マイナビ', '合同説明会', '2026-06-07', NULL, 'マリンメッセ福岡', ARRAY['総合'], 'https://job.mynavi.jp/conts/2027/expo/', 'mynavi', 'estimated'),
  (2026, 'マイナビ ITセミナーWEEK', 'マイナビ', '業界研究', '2026-06-14', '2026-06-20', 'オンライン', ARRAY['IT', 'SaaS', 'SIer'], 'https://job.mynavi.jp/conts/2027/seminar/', 'mynavi', 'estimated'),
  (2026, 'キャリタス就活 商社特集セミナー', 'キャリタス就活', '業界研究', '2026-06-21', NULL, 'オンライン', ARRAY['総合商社'], 'https://job.career-tasu.jp/2027/event/', 'careertasu', 'estimated'),
  (2026, 'マイナビ就職EXPO 札幌会場', 'マイナビ', '合同説明会', '2026-06-14', NULL, 'アクセス札幌', ARRAY['総合'], 'https://job.mynavi.jp/conts/2027/expo/', 'mynavi', 'estimated')
ON CONFLICT DO NOTHING;
