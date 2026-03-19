-- =====================================================
-- Pro プラン導入マイグレーション
-- 実行場所: Supabase SQL Editor
-- =====================================================

-- user_profiles に plan カラムを追加
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free'
  CHECK (plan IN ('free', 'pro'));

-- user_profiles に coupon_used カラムを追加（クーポン重複利用防止）
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS coupon_used text;

-- 管理者が手動でユーザーをProに変更する例:
-- UPDATE user_profiles SET plan = 'pro' WHERE id = '<user_uuid>';
