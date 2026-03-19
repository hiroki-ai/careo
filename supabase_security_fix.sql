-- =====================================================
-- Security Advisor 修正SQL
-- 2026-03-19
-- Supabase SQL Editor で実行すること
-- =====================================================

-- =====================================================
-- [Fix 1] update_updated_at 関数: search_path を固定
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- =====================================================
-- [Fix 2] get_insights_by_graduation_year 関数:
--   SECURITY DEFINER + search_path 固定 + スキーマ修飾名
-- =====================================================
CREATE OR REPLACE FUNCTION get_insights_by_graduation_year(p_graduation_year INT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', COUNT(DISTINCT up.id),
    'avg_companies_per_user', ROUND(COALESCE(AVG(comp_counts.cnt), 0)::numeric, 1),
    'offer_rate', ROUND(COALESCE(
      SUM(CASE WHEN comp_counts.offered > 0 THEN 1.0 ELSE 0.0 END) /
      NULLIF(COUNT(DISTINCT up.id), 0),
      0
    )::numeric, 2),
    'avg_interviews_before_offer', ROUND(COALESCE(AVG(interview_counts.cnt), 0)::numeric, 1),
    'top_industries', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT c.industry, COUNT(*) AS count
        FROM public.companies c
        JOIN public.user_profiles up2 ON c.user_id = up2.id
        WHERE up2.graduation_year = p_graduation_year
          AND c.industry IS NOT NULL AND c.industry != ''
          AND c.status != 'WISHLIST'
        GROUP BY c.industry
        ORDER BY count DESC
        LIMIT 5
      ) t
    )
  ) INTO result
  FROM public.user_profiles up
  LEFT JOIN (
    SELECT user_id,
           COUNT(*) AS cnt,
           SUM(CASE WHEN status = 'OFFERED' THEN 1 ELSE 0 END) AS offered
    FROM public.companies
    WHERE status != 'WISHLIST'
    GROUP BY user_id
  ) comp_counts ON comp_counts.user_id = up.id
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS cnt
    FROM public.interviews
    GROUP BY user_id
  ) interview_counts ON interview_counts.user_id = up.id
  WHERE up.graduation_year = p_graduation_year;

  RETURN result;
END;
$$;

-- =====================================================
-- [Fix 3] lp_settings: RLS を有効化 + 公開読み取り許可
--   (LPページからANON_KEYで読み取るため)
-- =====================================================
ALTER TABLE lp_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read lp_settings" ON lp_settings;
CREATE POLICY "Public can read lp_settings"
  ON lp_settings FOR SELECT
  USING (true);

-- =====================================================
-- [Fix 4] board_meetings / team_reports: RLS を有効化
--   → ポリシーなし = 外部から一切アクセス不可
--   → これらのテーブルはサーバー側でSERVICE_ROLE_KEYを使うよう変更する
-- =====================================================
ALTER TABLE board_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_reports ENABLE ROW LEVEL SECURITY;
