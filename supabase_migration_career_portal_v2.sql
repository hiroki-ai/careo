-- ============================================================
-- キャリアセンターポータル Phase 1 マイグレーション v2（冪等版）
-- ============================================================

-- キャリアセンタースタッフテーブル
CREATE TABLE IF NOT EXISTS career_center_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  university text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'staff',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE career_center_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff can read own record" ON career_center_staff;
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
  target_grade text,
  target_grad_year integer,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE career_center_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff can manage own university announcements" ON career_center_announcements;
CREATE POLICY "staff can manage own university announcements"
  ON career_center_announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM career_center_staff
      WHERE user_id = auth.uid()
        AND university = career_center_announcements.university
    )
  );

DROP POLICY IF EXISTS "students can read announcements from their university" ON career_center_announcements;
CREATE POLICY "students can read announcements from their university"
  ON career_center_announcements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND university = career_center_announcements.university
    )
  );

-- アクセスログテーブル
CREATE TABLE IF NOT EXISTS career_center_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES career_center_staff(id) ON DELETE CASCADE NOT NULL,
  student_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  university text NOT NULL,
  accessed_at timestamptz DEFAULT now()
);

ALTER TABLE career_center_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff can insert own access logs" ON career_center_access_logs;
CREATE POLICY "staff can insert own access logs"
  ON career_center_access_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_center_staff
      WHERE user_id = auth.uid()
        AND id = career_center_access_logs.staff_id
    )
  );

DROP POLICY IF EXISTS "staff can read own access logs" ON career_center_access_logs;
CREATE POLICY "staff can read own access logs"
  ON career_center_access_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_center_staff
      WHERE user_id = auth.uid()
        AND id = career_center_access_logs.staff_id
    )
  );

-- user_profiles への RLS ポリシー追加
DROP POLICY IF EXISTS "career_center_staff can read same university profiles" ON user_profiles;
CREATE POLICY "career_center_staff can read same university profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_center_staff
      WHERE user_id = auth.uid()
        AND university = user_profiles.university
    )
  );

-- companies への RLS ポリシー追加
DROP POLICY IF EXISTS "career_center_staff can read same university companies" ON companies;
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

-- ob_visits への RLS ポリシー追加
DROP POLICY IF EXISTS "career_center_staff can read same university ob_visits" ON ob_visits;
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

-- aptitude_tests への RLS ポリシー追加
DROP POLICY IF EXISTS "career_center_staff can read same university aptitude_tests" ON aptitude_tests;
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

-- インデックス
CREATE INDEX IF NOT EXISTS idx_career_center_staff_university ON career_center_staff(university);
CREATE INDEX IF NOT EXISTS idx_career_center_announcements_university ON career_center_announcements(university);
CREATE INDEX IF NOT EXISTS idx_career_center_access_logs_staff_id ON career_center_access_logs(staff_id);
