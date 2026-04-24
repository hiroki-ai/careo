-- =====================================================
-- 公開プロフィール機能
-- 実行場所: Supabase SQL Editor
-- =====================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_profile_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_bio text,
  ADD COLUMN IF NOT EXISTS public_x_handle text,
  ADD COLUMN IF NOT EXISTS public_linkedin_url text;

CREATE INDEX IF NOT EXISTS idx_user_profiles_username_public
  ON user_profiles (username) WHERE is_profile_public = true;

-- 匿名でユーザー名から公開プロフィールを取得するRPC
-- 戻り値は公開OKなデータだけ。非公開ユーザーは空配列を返す。
CREATE OR REPLACE FUNCTION get_public_profile(p_username text)
RETURNS TABLE (
  username text,
  university text,
  faculty text,
  grade text,
  graduation_year integer,
  target_industries text[],
  target_jobs text[],
  job_search_stage text,
  public_bio text,
  public_x_handle text,
  public_linkedin_url text,
  companies_count bigint,
  offered_count bigint,
  es_count bigint,
  interview_count bigint,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.username,
    up.university,
    up.faculty,
    up.grade,
    up.graduation_year,
    up.target_industries,
    up.target_jobs,
    up.job_search_stage::text,
    up.public_bio,
    up.public_x_handle,
    up.public_linkedin_url,
    (SELECT count(*) FROM companies c WHERE c.user_id = up.id),
    (SELECT count(*) FROM companies c WHERE c.user_id = up.id AND c.status = 'OFFERED'),
    (SELECT count(*) FROM es_entries e WHERE e.user_id = up.id),
    (SELECT count(*) FROM interviews i WHERE i.user_id = up.id),
    up.created_at
  FROM user_profiles up
  WHERE up.username = p_username
    AND up.is_profile_public = true
  LIMIT 1;
END;
$$;
