-- ============================================================
-- Openwork 口コミ評価カラムを companies に追加
-- ============================================================
-- 8軸（待遇/士気/風通し/相互尊重/20代成長/人材育成/法令順守/評価適正）
-- + 残業時間・有休消化率・総合スコア・ソースURL・メモ
-- ============================================================

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS openwork_ratings jsonb;

COMMENT ON COLUMN companies.openwork_ratings IS
  'Openwork 口コミ評価 {compensation, morale, openness, respect, growth20s, development, compliance, evaluation, totalScore, overtimeHours, paidLeaveRate, sourceUrl, memo}';
