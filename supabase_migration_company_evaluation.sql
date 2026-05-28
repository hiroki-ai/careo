-- ============================================================
-- 企業評価軸の大幅拡張マイグレーション
-- ============================================================
-- 個人ダッシュボード shukatsu-site で実証された戦略評価軸を Careo に移植。
-- 全カラム冪等（IF NOT EXISTS）・NULL 可で既存データを破壊しない。
--
-- 追加するもの:
--   - 3圏（安全/努力/挑戦）
--   - 軸合致度（🥇/🌟/🟡/❌）
--   - 志望優先度（S/A/B/C）
--   - 合格可能性スコア 0-100（学歴/ガクチカ/軸/競争/英語/特殊 の6軸内訳）
--   - 5/10年ビジョン適合度（◎/○/△/✕）
--   - tagline / positioning / 上場情報（ticker_code, stock_trend, outlook）
--   - 自分視点メモ（why_for_me, concerns, recommended_roles, strengths）
--   - 落ち分析 / 締切 / 外部サイトURL（ワンキャリア・Openwork）
-- ============================================================

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS tagline               text,
  ADD COLUMN IF NOT EXISTS positioning           text,
  ADD COLUMN IF NOT EXISTS tier                  text CHECK (tier IN ('safe','effort','challenge')),
  ADD COLUMN IF NOT EXISTS axis_match            text CHECK (axis_match IN ('perfect','strong','neutral','mismatch')),
  ADD COLUMN IF NOT EXISTS priority              text CHECK (priority IN ('S','A','B','C')),
  ADD COLUMN IF NOT EXISTS pass_score            integer CHECK (pass_score >= 0 AND pass_score <= 100),
  ADD COLUMN IF NOT EXISTS pass_score_note       text,
  ADD COLUMN IF NOT EXISTS pass_score_breakdown  jsonb,
  ADD COLUMN IF NOT EXISTS vision_fit_5y         text CHECK (vision_fit_5y IN ('excellent','good','conditional','difficult')),
  ADD COLUMN IF NOT EXISTS vision_fit_5y_note    text,
  ADD COLUMN IF NOT EXISTS vision_fit_10y        text CHECK (vision_fit_10y IN ('excellent','good','conditional','difficult')),
  ADD COLUMN IF NOT EXISTS vision_fit_10y_note   text,
  ADD COLUMN IF NOT EXISTS employees             text,
  ADD COLUMN IF NOT EXISTS revenue               text,
  ADD COLUMN IF NOT EXISTS avg_salary            text,
  ADD COLUMN IF NOT EXISTS ticker_code           text,
  ADD COLUMN IF NOT EXISTS stock_trend           text,
  ADD COLUMN IF NOT EXISTS outlook               text,
  ADD COLUMN IF NOT EXISTS deadline              text,
  ADD COLUMN IF NOT EXISTS recommended_roles     text[],
  ADD COLUMN IF NOT EXISTS strengths             text[],
  ADD COLUMN IF NOT EXISTS why_for_me            text[],
  ADD COLUMN IF NOT EXISTS concerns              text[],
  ADD COLUMN IF NOT EXISTS rejection_analysis    text,
  ADD COLUMN IF NOT EXISTS one_career_url        text,
  ADD COLUMN IF NOT EXISTS openwork_url          text;

-- 列コメント（Supabase Dashboard で意味を確認できるように）
COMMENT ON COLUMN companies.tier                 IS '3圏: safe=安全圏 / effort=努力圏 / challenge=挑戦圏';
COMMENT ON COLUMN companies.axis_match           IS '軸合致度: perfect=🥇最有力 / strong=🌟強く合う / neutral=🟡要確認 / mismatch=❌合わない';
COMMENT ON COLUMN companies.priority             IS '志望優先度 S/A/B/C';
COMMENT ON COLUMN companies.pass_score           IS '合格可能性スコア 0-100（AI採点）';
COMMENT ON COLUMN companies.pass_score_breakdown IS '採点軸別内訳 {gakureki:20,gakuchika:25,axis:20,competition:15,english:10,special:10}';
COMMENT ON COLUMN companies.vision_fit_5y        IS '5年後ビジョン適合度: excellent=◎ / good=○ / conditional=△ / difficult=✕';
COMMENT ON COLUMN companies.vision_fit_10y       IS '10年後ビジョン適合度';
COMMENT ON COLUMN companies.recommended_roles    IS 'おすすめ職種・コース（複数可）';
COMMENT ON COLUMN companies.why_for_me           IS '「なぜ自分に合うか」自分視点メモ（箇条書き）';
COMMENT ON COLUMN companies.concerns             IS '懸念点（箇条書き）';
COMMENT ON COLUMN companies.rejection_analysis   IS 'お祈り時の振り返り・推定要因分析';
COMMENT ON COLUMN companies.deadline             IS '次の締切（フリーテキスト「2026-05-27 12:00」等）';

-- 検索性能のためのインデックス
CREATE INDEX IF NOT EXISTS idx_companies_tier        ON companies(tier)        WHERE tier IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_axis_match  ON companies(axis_match)  WHERE axis_match IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_pass_score  ON companies(pass_score)  WHERE pass_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_priority    ON companies(priority)    WHERE priority IS NOT NULL;

-- 既存の RLS ポリシーは「自分のレコードのみ」の前提で動いているので追加変更不要。
-- 新カラムも同じポリシーで自動的に保護される。
