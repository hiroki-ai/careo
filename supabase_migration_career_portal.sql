-- ============================================================
-- キャリアセンターポータル Phase 1 マイグレーション
-- 実行日: 未実行
-- ============================================================

-- キャリアセンタースタッフテーブル
CREATE TABLE IF NOT EXISTS career_center_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  university text NOT NULL,  -- user_profiles.university と照合してテナント分離
  name text NOT NULL,
  role text NOT NULL DEFAULT 'staff', -- 'staff' | 'manager'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE career_center_staff ENABLE ROW LEVEL SECURITY;

-- スタッフは自分のレコードのみ読み取り可能（管理者がSERVICE_ROLEで管理）
CREATE POLICY "staff can read own record"
  ON career_center_staff FOR SELECT
  USING (auth.uid() = user_id);

-- キャリアセンターアナウンステーブル
CREATE TABLE IF NOT EXISTS career_center_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES career_center_staff(id) ON DELETE CASCADE NOT NULL,
  university text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  target_grade text,           -- NULL = 全学年, "学部3年" など学年指定
  target_grad_year integer,    -- NULL = 全卒業年度
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE career_center_announcements ENABLE ROW LEVEL SECURITY;

-- スタッフは同一大学のアナウンスのみ操作可能
CREATE POLICY "staff can manage own university announcements"
  ON career_center_announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM career_center_staff
      WHERE user_id = auth.uid()
        AND university = career_center_announcements.university
    )
  );

-- 学生は自分の大学のアナウンスを読み取り可能
CREATE POLICY "students can read announcements from their university"
  ON career_center_announcements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND university = career_center_announcements.university
    )
  );

-- アクセスログテーブル（スタッフが学生データを閲覧した記録）
CREATE TABLE IF NOT EXISTS career_center_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES career_center_staff(id) ON DELETE CASCADE NOT NULL,
  student_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  university text NOT NULL,
  accessed_at timestamptz DEFAULT now()
);

ALTER TABLE career_center_access_logs ENABLE ROW LEVEL SECURITY;

-- スタッフは自分のログのみ書き込み可能
CREATE POLICY "staff can insert own access logs"
  ON career_center_access_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_center_staff
      WHERE user_id = auth.uid()
        AND id = career_center_access_logs.staff_id
    )
  );

CREATE POLICY "staff can read own access logs"
  ON career_center_access_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_center_staff
      WHERE user_id = auth.uid()
        AND id = career_center_access_logs.staff_id
    )
  );

-- ============================================================
-- スタッフが同一大学の学生プロフィールを閲覧するためのRLSポリシー追加
-- ============================================================

-- user_profiles: スタッフが同一大学の学生プロフィールを読み取れるポリシー
CREATE POLICY "career_center_staff can read same university profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_center_staff
      WHERE user_id = auth.uid()
        AND university = user_profiles.university
    )
  );

-- companies: スタッフが同一大学学生の企業データを読み取れるポリシー
CREATE POLICY "career_center_staff can read same university companies"
  ON companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_center_staff cs
      JOIN user_profiles up ON up.university = cs.university
      WHERE cs.user_id = auth.uid()
        AND up.id = companies.user_id
    )
  );

-- ob_visits: スタッフが同一大学学生のOB訪問データを読み取れるポリシー
CREATE POLICY "career_center_staff can read same university ob_visits"
  ON ob_visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_center_staff cs
      JOIN user_profiles up ON up.university = cs.university
      WHERE cs.user_id = auth.uid()
        AND up.id = ob_visits.user_id
    )
  );

-- aptitude_tests: スタッフが同一大学学生の筆記試験データを読み取れるポリシー
CREATE POLICY "career_center_staff can read same university aptitude_tests"
  ON aptitude_tests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_center_staff cs
      JOIN user_profiles up ON up.university = cs.university
      WHERE cs.user_id = auth.uid()
        AND up.id = aptitude_tests.user_id
    )
  );

-- ============================================================
-- インデックス
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_career_center_staff_university ON career_center_staff(university);
CREATE INDEX IF NOT EXISTS idx_career_center_announcements_university ON career_center_announcements(university);
CREATE INDEX IF NOT EXISTS idx_career_center_access_logs_staff_id ON career_center_access_logs(staff_id);
