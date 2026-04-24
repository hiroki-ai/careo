-- =====================================================
-- Pro 30日間無料トライアル
-- 実行場所: Supabase SQL Editor
-- =====================================================

-- user_profiles にトライアル開始日時カラムを追加（NULLならまだ未使用）
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz;

-- 動作確認: SELECT id, plan, plan_period_end, trial_started_at FROM user_profiles LIMIT 5;
