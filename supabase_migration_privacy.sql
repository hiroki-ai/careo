-- ============================================================
-- Careo Migration: career_center_visibility
-- キャリアセンターへの公開設定カラムを user_profiles に追加
-- 実行日: 2026-03-24
-- ============================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS career_center_visibility JSONB NOT NULL DEFAULT '{
    "targetIndustriesJobs": true,
    "companies": true,
    "esSelfAnalysis": true,
    "obVisits": true,
    "aptitudeTests": true,
    "offerStatus": true
  }'::jsonb;
