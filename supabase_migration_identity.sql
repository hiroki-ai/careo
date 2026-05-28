-- ============================================================
-- Identity 構造化マイグレーション
-- ============================================================
-- shukatsu-site で実証された Identity 構造（軸の3層・5/10年ビジョン・強み×証拠）を
-- user_profiles に追加。全カラム JSONB・冪等・NULL 許容で既存データを壊さない。
--
-- 追加するもの:
--   - axis_layers (jsonb): 軸の3層構造 {deepest, middle, surface}
--   - vision_5y / vision_10y (jsonb): 未来ビジョン {age, career, lifestyle, network, income}
--   - strengths_with_evidence (jsonb): [{name, description, evidences[]}]
--   - job_role_priorities (jsonb): [{rank, role, reason}]
-- ============================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS axis_layers              jsonb,
  ADD COLUMN IF NOT EXISTS vision_5y                jsonb,
  ADD COLUMN IF NOT EXISTS vision_10y               jsonb,
  ADD COLUMN IF NOT EXISTS strengths_with_evidence  jsonb,
  ADD COLUMN IF NOT EXISTS job_role_priorities      jsonb;

COMMENT ON COLUMN user_profiles.axis_layers             IS '軸の3層構造 {deepest, middle, surface}';
COMMENT ON COLUMN user_profiles.vision_5y               IS '5年後ビジョン {age, career, lifestyle, network, income}';
COMMENT ON COLUMN user_profiles.vision_10y              IS '10年後ビジョン';
COMMENT ON COLUMN user_profiles.strengths_with_evidence IS '強み×証拠エピソード [{name, description, evidences[]}]';
COMMENT ON COLUMN user_profiles.job_role_priorities     IS '職種優先順位 [{rank, role, reason}]';

-- 既存 RLS（自分のレコードのみ）は新カラムにも自動適用される。
