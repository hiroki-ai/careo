-- =====================================================
-- Security Fix v3
-- 2026-04-16
-- RLS未設定テーブルの一括修正
-- Supabase SQL Editor で実行すること
-- =====================================================

-- =====================================================
-- [1] user_profiles: RLS 有効化
--   ユーザーは自分のプロフィールのみ CRUD 可能
--   キャリアセンタースタッフは同大学の学生を SELECT 可能
--   （career_portal_v2 で追加済みのポリシーがあれば重複回避）
-- =====================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 自分のプロフィール: 全操作
DROP POLICY IF EXISTS "users can manage own profile" ON user_profiles;
CREATE POLICY "users can manage own profile"
  ON user_profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- キャリアセンタースタッフ: 同大学の学生プロフィールを閲覧
DROP POLICY IF EXISTS "career_center_staff can read same university profiles" ON user_profiles;
CREATE POLICY "career_center_staff can read same university profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_center_staff cs
      WHERE cs.user_id = auth.uid()
        AND cs.university = user_profiles.university
    )
  );

-- =====================================================
-- [2] chat_messages: RLS 有効化
--   ユーザーは自分のチャット履歴のみ CRUD 可能
-- =====================================================
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can manage own chat_messages" ON chat_messages;
CREATE POLICY "users can manage own chat_messages"
  ON chat_messages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- [3] action_items: RLS 有効化
--   ユーザーは自分のアクションアイテムのみ CRUD 可能
-- =====================================================
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can manage own action_items" ON action_items;
CREATE POLICY "users can manage own action_items"
  ON action_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- [4] company_events: RLS 有効化
--   ユーザーは自分のイベントのみ CRUD 可能
-- =====================================================
ALTER TABLE company_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can manage own company_events" ON company_events;
CREATE POLICY "users can manage own company_events"
  ON company_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- [5] career_center_alerts: RLS 有効化
--   キャリアセンタースタッフが同大学のアラートを参照・更新
--   作成は cron (service_role) 経由のみ
-- =====================================================
ALTER TABLE career_center_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff can read own university alerts" ON career_center_alerts;
CREATE POLICY "staff can read own university alerts"
  ON career_center_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_center_staff cs
      WHERE cs.user_id = auth.uid()
        AND cs.university = career_center_alerts.university
    )
  );

DROP POLICY IF EXISTS "staff can update own university alerts" ON career_center_alerts;
CREATE POLICY "staff can update own university alerts"
  ON career_center_alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_center_staff cs
      WHERE cs.user_id = auth.uid()
        AND cs.university = career_center_alerts.university
    )
  );

-- =====================================================
-- [6] es_review_requests: RLS 有効化
--   学生は自分のリクエストを作成・参照
--   スタッフは同大学のリクエストを参照・更新
-- =====================================================
ALTER TABLE es_review_requests ENABLE ROW LEVEL SECURITY;

-- 学生: 自分のリクエストを INSERT
DROP POLICY IF EXISTS "students can insert own es_review_requests" ON es_review_requests;
CREATE POLICY "students can insert own es_review_requests"
  ON es_review_requests FOR INSERT
  WITH CHECK (auth.uid() = student_user_id);

-- 学生: 自分のリクエストを SELECT
DROP POLICY IF EXISTS "students can read own es_review_requests" ON es_review_requests;
CREATE POLICY "students can read own es_review_requests"
  ON es_review_requests FOR SELECT
  USING (auth.uid() = student_user_id);

-- スタッフ: 同大学のリクエストを SELECT
DROP POLICY IF EXISTS "staff can read university es_review_requests" ON es_review_requests;
CREATE POLICY "staff can read university es_review_requests"
  ON es_review_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_center_staff cs
      WHERE cs.user_id = auth.uid()
        AND cs.university = es_review_requests.university
    )
  );

-- スタッフ: 同大学のリクエストを UPDATE（フィードバック記入）
DROP POLICY IF EXISTS "staff can update university es_review_requests" ON es_review_requests;
CREATE POLICY "staff can update university es_review_requests"
  ON es_review_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_center_staff cs
      WHERE cs.user_id = auth.uid()
        AND cs.university = es_review_requests.university
    )
  );

-- =====================================================
-- [7] career_center_meetings: RLS 有効化
--   スタッフは同大学の面談記録を参照・作成
-- =====================================================
ALTER TABLE career_center_meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff can read university meetings" ON career_center_meetings;
CREATE POLICY "staff can read university meetings"
  ON career_center_meetings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_center_staff cs
      WHERE cs.user_id = auth.uid()
        AND cs.university = career_center_meetings.university
    )
  );

DROP POLICY IF EXISTS "staff can insert university meetings" ON career_center_meetings;
CREATE POLICY "staff can insert university meetings"
  ON career_center_meetings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_center_staff cs
      WHERE cs.user_id = auth.uid()
        AND cs.university = career_center_meetings.university
    )
  );

-- =====================================================
-- 確認クエリ（実行後にチェック）
-- =====================================================
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
