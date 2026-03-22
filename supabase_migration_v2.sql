-- ============================================================
-- Careo Migration v2 - 差別化機能用テーブル
-- 実行日: 2026年
-- ============================================================

-- ============================================================
-- 1. 自己分析履歴テーブル（戦略4: 就活軸の成長グラフ）
--    将来的に自己分析の変遷を時系列で追跡するために使用
-- ============================================================
CREATE TABLE IF NOT EXISTS self_analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field TEXT NOT NULL CHECK (field IN ('career_axis', 'gakuchika', 'self_pr', 'strengths', 'weaknesses')),
  content TEXT NOT NULL,
  content_length INTEGER NOT NULL DEFAULT 0,
  trigger TEXT DEFAULT 'manual' CHECK (trigger IN ('manual', 'chat', 'onboarding')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE self_analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history"
  ON self_analysis_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
  ON self_analysis_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_self_analysis_history_user_field
  ON self_analysis_history (user_id, field, created_at DESC);

-- ============================================================
-- 2. 就活グループテーブル（戦略7: 友達と一緒に就活）
-- ============================================================
CREATE TABLE IF NOT EXISTS study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_members INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS（グループはメンバーなら見える）
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view group"
  ON study_groups FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM group_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create group"
  ON study_groups FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- ============================================================
-- 3. グループメンバーシップテーブル
-- ============================================================
CREATE TABLE IF NOT EXISTS group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL DEFAULT '匿名ユーザー',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- 共有する統計（詳細データは非公開）
  companies_count INTEGER NOT NULL DEFAULT 0,
  interviews_count INTEGER NOT NULL DEFAULT 0,
  completed_actions_count INTEGER NOT NULL DEFAULT 0,
  pdca_score INTEGER,
  UNIQUE (group_id, user_id)
);

-- RLS
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view memberships"
  ON group_memberships FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON group_memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own membership"
  ON group_memberships FOR UPDATE
  USING (auth.uid() = user_id);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_group_memberships_group
  ON group_memberships (group_id);

CREATE INDEX IF NOT EXISTS idx_group_memberships_user
  ON group_memberships (user_id);

-- ============================================================
-- 4. ウェイトリスト（グループ機能通知登録）
-- ============================================================
CREATE TABLE IF NOT EXISTS feature_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  feature TEXT NOT NULL DEFAULT 'groups',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (email, feature)
);

ALTER TABLE feature_waitlist ENABLE ROW LEVEL SECURITY;

-- 誰でも自分のメールを登録できる（認証不要）
CREATE POLICY "Anyone can join waitlist"
  ON feature_waitlist FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 備考:
-- - study_groups, group_memberships は /groups ページで使用
-- - self_analysis_history は /career ページの成長グラフで使用
-- - feature_waitlist はウェイトリスト登録で使用
-- ============================================================
