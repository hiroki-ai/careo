-- =====================================================
-- 先輩就活データ共有（卒業後フック・29卒向け匿名閲覧）
-- 実行場所: Supabase SQL Editor
-- =====================================================

-- 面接データにも匿名共有フラグを追加（ES側には既にあり）
ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS is_shared_anonymously boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_interviews_shared
  ON interviews (is_shared_anonymously) WHERE is_shared_anonymously = true;

CREATE INDEX IF NOT EXISTS idx_es_entries_shared
  ON es_entries (is_shared_anonymously) WHERE is_shared_anonymously = true;

-- 後輩（29卒/30卒）が匿名で閲覧できる先輩ES一覧を返すRPC
-- 認証済みユーザーのみが実行可能。返却時に user_id は含めない。
CREATE OR REPLACE FUNCTION get_senpai_es(
  p_company_name text DEFAULT NULL,
  p_industry text DEFAULT NULL,
  p_limit integer DEFAULT 30
)
RETURNS TABLE (
  id uuid,
  company_name text,
  industry text,
  title text,
  questions jsonb,
  result text,
  graduation_year integer,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 認証チェック：呼び出し元が認証済みでなければ空返却
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    e.id,
    COALESCE(c.name, '') AS company_name,
    COALESCE(c.industry, '') AS industry,
    e.title,
    (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'question', q.question,
        'answer', q.answer
      ) ORDER BY q.order_index), '[]'::jsonb)
      FROM es_questions q
      WHERE q.es_entry_id = e.id
    ) AS questions,
    e.result::text,
    up.graduation_year,
    e.created_at
  FROM es_entries e
  LEFT JOIN companies c ON c.id = e.company_id
  LEFT JOIN user_profiles up ON up.id = e.user_id
  WHERE e.is_shared_anonymously = true
    AND e.status = 'SUBMITTED'
    AND (p_company_name IS NULL OR c.name ILIKE '%' || p_company_name || '%')
    AND (p_industry IS NULL OR c.industry = p_industry)
  ORDER BY e.created_at DESC
  LIMIT p_limit;
END;
$$;

-- 後輩が匿名で閲覧できる先輩面接ログを返すRPC
CREATE OR REPLACE FUNCTION get_senpai_interviews(
  p_company_name text DEFAULT NULL,
  p_industry text DEFAULT NULL,
  p_limit integer DEFAULT 30
)
RETURNS TABLE (
  id uuid,
  company_name text,
  industry text,
  round integer,
  questions jsonb,
  notes text,
  result text,
  graduation_year integer,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    i.id,
    COALESCE(c.name, '') AS company_name,
    COALESCE(c.industry, '') AS industry,
    i.round,
    (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'question', q.question,
        'answer', q.answer
      ) ORDER BY q.order_index), '[]'::jsonb)
      FROM interview_questions q
      WHERE q.interview_id = i.id
    ) AS questions,
    COALESCE(i.notes, '') AS notes,
    i.result::text,
    up.graduation_year,
    i.created_at
  FROM interviews i
  LEFT JOIN companies c ON c.id = i.company_id
  LEFT JOIN user_profiles up ON up.id = i.user_id
  WHERE i.is_shared_anonymously = true
    AND (p_company_name IS NULL OR c.name ILIKE '%' || p_company_name || '%')
    AND (p_industry IS NULL OR c.industry = p_industry)
  ORDER BY i.created_at DESC
  LIMIT p_limit;
END;
$$;

-- 共有されたES・面接を企業別に集計するRPC（検索サジェスト用）
CREATE OR REPLACE FUNCTION get_senpai_companies_summary(p_limit integer DEFAULT 30)
RETURNS TABLE (
  company_name text,
  industry text,
  es_count bigint,
  interview_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    c.name AS company_name,
    COALESCE(c.industry, '') AS industry,
    COUNT(DISTINCT CASE WHEN e.is_shared_anonymously AND e.status = 'SUBMITTED' THEN e.id END) AS es_count,
    COUNT(DISTINCT CASE WHEN i.is_shared_anonymously THEN i.id END) AS interview_count
  FROM companies c
  LEFT JOIN es_entries e ON e.company_id = c.id
  LEFT JOIN interviews i ON i.company_id = c.id
  GROUP BY c.name, c.industry
  HAVING COUNT(DISTINCT CASE WHEN e.is_shared_anonymously AND e.status = 'SUBMITTED' THEN e.id END)
    + COUNT(DISTINCT CASE WHEN i.is_shared_anonymously THEN i.id END) > 0
  ORDER BY es_count + interview_count DESC
  LIMIT p_limit;
END;
$$;
