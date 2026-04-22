-- =====================================================
-- AI使用回数カウンター（無料ユーザーの月次制限用）
-- 実行場所: Supabase SQL Editor
-- =====================================================

-- ユーザー×機能×月のカウンターテーブル
CREATE TABLE IF NOT EXISTS ai_usage_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL,         -- next-action / pdca / insights / company-suggest / weekly-coach / industry-analysis
  period_month text NOT NULL,    -- "2026-04" 形式
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, feature, period_month)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_counts_user_feature
  ON ai_usage_counts (user_id, feature, period_month);

-- RLS 設定
ALTER TABLE ai_usage_counts ENABLE ROW LEVEL SECURITY;

-- 自分のカウンターだけ参照可
DROP POLICY IF EXISTS "Users read own usage" ON ai_usage_counts;
CREATE POLICY "Users read own usage" ON ai_usage_counts
  FOR SELECT
  USING (auth.uid() = user_id);

-- サーバー（service_role）のみ書き込み可。クライアントから書かない。
-- サービスロールはRLSをバイパスするので、他のポリシーは不要。

-- 月次カウンター取得・増加のRPC関数
-- 返り値: { count: 現在値, limit_exceeded: boolean }
CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_user_id uuid,
  p_feature text,
  p_limit integer
)
RETURNS TABLE (new_count integer, limit_exceeded boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period text := to_char(now() AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM');
  v_count integer;
BEGIN
  INSERT INTO ai_usage_counts (user_id, feature, period_month, count)
  VALUES (p_user_id, p_feature, v_period, 1)
  ON CONFLICT (user_id, feature, period_month)
  DO UPDATE SET count = ai_usage_counts.count + 1, updated_at = now()
  RETURNING count INTO v_count;

  RETURN QUERY SELECT v_count, (p_limit > 0 AND v_count > p_limit);
END;
$$;

-- 使用回数を見るだけの関数（インクリメントしない）
CREATE OR REPLACE FUNCTION get_ai_usage(
  p_user_id uuid,
  p_feature text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period text := to_char(now() AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM');
  v_count integer;
BEGIN
  SELECT count INTO v_count
  FROM ai_usage_counts
  WHERE user_id = p_user_id
    AND feature = p_feature
    AND period_month = v_period;
  RETURN COALESCE(v_count, 0);
END;
$$;
