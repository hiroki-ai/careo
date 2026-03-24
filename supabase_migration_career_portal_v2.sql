-- ============================================================
-- キャリアセンターポータル Phase 2 マイグレーション
-- 6機能: 面談記録 / ES添削 / アラート / メッセージ / イベント / 統計
-- ============================================================

-- ── last_active_at カラム追加（孤立学生アラート用）──────────────
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();

-- ── 面談記録テーブル ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS career_center_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES career_center_staff(id) ON DELETE CASCADE NOT NULL,
  student_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  university text NOT NULL,
  met_at date NOT NULL DEFAULT current_date,
  notes text,
  outcome text DEFAULT 'neutral', -- 'positive' | 'neutral' | 'followup_needed'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE career_center_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can manage own university meetings"
  ON career_center_meetings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM career_center_staff
      WHERE user_id = auth.uid()
        AND university = career_center_meetings.university
    )
  );

-- 学生は自分が対象の面談記録を参照可能（面談済みバッジ用）
CREATE POLICY "students can read own meetings"
  ON career_center_meetings FOR SELECT
  USING (student_user_id = auth.uid());

-- ── ES添削依頼テーブル ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS es_review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  university text NOT NULL,
  es_entry_id uuid REFERENCES es_entries(id) ON DELETE CASCADE NOT NULL,
  es_snapshot jsonb NOT NULL,          -- 依頼時点のESスナップショット（設問・回答）
  company_name text,
  student_message text,
  ai_comment jsonb,                    -- EsCheckResult 形式
  ai_generated_at timestamptz,
  staff_feedback text,
  staff_id uuid REFERENCES career_center_staff(id),
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'ai_done' | 'staff_done' | 'closed'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE es_review_requests ENABLE ROW LEVEL SECURITY;

-- 学生は自分の依頼のみ操作
CREATE POLICY "students can manage own es review requests"
  ON es_review_requests FOR ALL
  USING (student_user_id = auth.uid());

-- スタッフは同一大学の依頼を参照・更新
CREATE POLICY "staff can manage same university es reviews"
  ON es_review_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM career_center_staff
      WHERE user_id = auth.uid()
        AND university = es_review_requests.university
    )
  );

-- ── アラートテーブル ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS career_center_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university text NOT NULL,
  student_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alert_type text NOT NULL,
  -- 'inactive_30d' | 'no_companies_late' | 'consecutive_rejections'
  alert_detail jsonb,
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_by uuid REFERENCES career_center_staff(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(university, student_user_id, alert_type)
);

ALTER TABLE career_center_alerts ENABLE ROW LEVEL SECURITY;

-- スタッフは同一大学のアラートを操作（学生はアクセス不可）
CREATE POLICY "staff can manage same university alerts"
  ON career_center_alerts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM career_center_staff
      WHERE user_id = auth.uid()
        AND university = career_center_alerts.university
    )
  );

-- ── 職員→学生メッセージテーブル ──────────────────────────────────
CREATE TABLE IF NOT EXISTS career_center_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES career_center_staff(id) ON DELETE CASCADE NOT NULL,
  student_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  university text NOT NULL,
  body text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE career_center_messages ENABLE ROW LEVEL SECURITY;

-- スタッフは同一大学へ送信・参照
CREATE POLICY "staff can manage own university messages"
  ON career_center_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM career_center_staff
      WHERE user_id = auth.uid()
        AND university = career_center_messages.university
    )
  );

-- 学生は自分宛てのメッセージを参照・既読更新
CREATE POLICY "students can read own messages"
  ON career_center_messages FOR SELECT
  USING (student_user_id = auth.uid());

CREATE POLICY "students can mark own messages read"
  ON career_center_messages FOR UPDATE
  USING (student_user_id = auth.uid())
  WITH CHECK (student_user_id = auth.uid());

-- ── イベントテーブル ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS career_center_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES career_center_staff(id) ON DELETE CASCADE NOT NULL,
  university text NOT NULL,
  title text NOT NULL,
  event_type text NOT NULL DEFAULT 'guidance',
  -- 'guidance' | 'briefing' | 'workshop' | 'other'
  held_at date NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE career_center_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can manage own university events"
  ON career_center_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM career_center_staff
      WHERE user_id = auth.uid()
        AND university = career_center_events.university
    )
  );

-- ── 出席管理テーブル ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS career_center_event_attendances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES career_center_events(id) ON DELETE CASCADE NOT NULL,
  student_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  university text NOT NULL,
  attended_at timestamptz DEFAULT now(),
  UNIQUE(event_id, student_user_id)
);

ALTER TABLE career_center_event_attendances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can manage same university attendances"
  ON career_center_event_attendances FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM career_center_staff
      WHERE user_id = auth.uid()
        AND university = career_center_event_attendances.university
    )
  );

-- 学生は自分の出席記録を参照
CREATE POLICY "students can read own attendances"
  ON career_center_event_attendances FOR SELECT
  USING (student_user_id = auth.uid());

-- ── インデックス ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_career_center_meetings_university  ON career_center_meetings(university);
CREATE INDEX IF NOT EXISTS idx_career_center_meetings_student     ON career_center_meetings(student_user_id);
CREATE INDEX IF NOT EXISTS idx_es_review_requests_university      ON es_review_requests(university);
CREATE INDEX IF NOT EXISTS idx_es_review_requests_student         ON es_review_requests(student_user_id);
CREATE INDEX IF NOT EXISTS idx_career_center_alerts_university    ON career_center_alerts(university);
CREATE INDEX IF NOT EXISTS idx_career_center_alerts_student       ON career_center_alerts(student_user_id);
CREATE INDEX IF NOT EXISTS idx_career_center_messages_student     ON career_center_messages(student_user_id);
CREATE INDEX IF NOT EXISTS idx_career_center_events_university    ON career_center_events(university);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active          ON user_profiles(last_active_at);
