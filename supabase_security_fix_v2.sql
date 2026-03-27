-- =====================================================
-- Security Fix v2
-- 2026-03-27
-- Supabase SQL Editor で実行すること
-- =====================================================

-- =====================================================
-- [Fix 1] career_center_inquiries: RLS を有効化
--   現状: RLS 無効のため anon キーで全件参照可能
--   対応: RLS を有効化し、ポリシーなし（外部アクセス不可）にする
--   アプリ側: /api/career-center-inquiry は SUPABASE_SERVICE_ROLE_KEY 経由のため影響なし
--   service_role は RLS をバイパスするため既存機能はそのまま動作する
-- =====================================================
ALTER TABLE career_center_inquiries ENABLE ROW LEVEL SECURITY;
-- ポリシーなし = anon / authenticated からは一切アクセス不可
-- service_role（サーバーサイドAPI）のみアクセス可能

-- =====================================================
-- 確認クエリ（実行後に念のためチェック）
-- =====================================================
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
