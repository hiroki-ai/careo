-- =====================================================
-- Stripe サブスクリプション連携マイグレーション
-- 実行場所: Supabase SQL Editor
-- =====================================================

-- user_profiles に Stripe 関連カラムを追加
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS plan_period_end timestamptz;

-- plan カラムのCHECK制約は既存（'free' or 'pro'）。canceled状態は plan='pro' のまま plan_period_end まで利用可能。

-- 管理者がユーザーのStripe状態を確認するビュー（サービスロール専用）
CREATE OR REPLACE VIEW admin_subscription_status AS
SELECT
  up.id AS user_id,
  up.plan,
  up.stripe_customer_id,
  up.stripe_subscription_id,
  up.plan_period_end,
  up.created_at,
  up.updated_at,
  au.email
FROM user_profiles up
LEFT JOIN auth.users au ON au.id = up.id;

-- 管理者ビューにはRLS不要（service_roleのみアクセス想定）
