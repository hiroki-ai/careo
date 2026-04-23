-- =====================================================
-- 紹介コードシステム
-- 実行場所: Supabase SQL Editor
-- =====================================================

-- user_profiles に紹介コードカラムを追加
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_user_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code
  ON user_profiles (referral_code);

-- 紹介イベントを記録するテーブル（誰が誰を招待したか + 特典付与状況）
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  referrer_reward_granted boolean NOT NULL DEFAULT false,
  referee_reward_granted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals (referee_id);

-- RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- 自分が referrer のレコードだけ参照可
DROP POLICY IF EXISTS "Users read own referrals as referrer" ON referrals;
CREATE POLICY "Users read own referrals as referrer" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);

-- referral_code を持たないユーザーに自動付与する関数
-- 既存ユーザーにも1回実行することで全員に付与される
CREATE OR REPLACE FUNCTION backfill_referral_codes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer := 0;
  v_row record;
  v_code text;
BEGIN
  FOR v_row IN SELECT id FROM user_profiles WHERE referral_code IS NULL LOOP
    -- UUIDの先頭8文字を大文字で使う（衝突の可能性は低い）
    v_code := upper(replace(v_row.id::text, '-', ''));
    v_code := substr(v_code, 1, 8);
    UPDATE user_profiles SET referral_code = v_code WHERE id = v_row.id;
    v_updated := v_updated + 1;
  END LOOP;
  RETURN v_updated;
END;
$$;

-- 実行: SELECT backfill_referral_codes();

-- 新規ユーザー作成時に自動で referral_code を発行するトリガー
CREATE OR REPLACE FUNCTION auto_assign_referral_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := substr(upper(replace(NEW.id::text, '-', '')), 1, 8);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_assign_referral_code ON user_profiles;
CREATE TRIGGER trg_auto_assign_referral_code
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_referral_code();

-- 紹介者と被紹介者の両方に Pro を付与する RPC（トランザクション内で完結）
-- 返り値:
--   { success: boolean, error: text }
CREATE OR REPLACE FUNCTION grant_referral_rewards(
  p_referrer_code text,
  p_referee_id uuid
)
RETURNS TABLE (success boolean, error_msg text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
  v_referee_current_plan text;
  v_referee_period_end timestamptz;
  v_now timestamptz := now();
  v_thirty_days interval := interval '30 days';
BEGIN
  -- コードから紹介者を特定
  SELECT id INTO v_referrer_id
  FROM user_profiles
  WHERE referral_code = upper(p_referrer_code);

  IF v_referrer_id IS NULL THEN
    RETURN QUERY SELECT false, '無効な紹介コードです'::text;
    RETURN;
  END IF;

  IF v_referrer_id = p_referee_id THEN
    RETURN QUERY SELECT false, '自分の紹介コードは使用できません'::text;
    RETURN;
  END IF;

  -- 既に特典付与済みチェック
  IF EXISTS (SELECT 1 FROM referrals WHERE referee_id = p_referee_id) THEN
    RETURN QUERY SELECT false, 'すでに紹介特典を使用済みです'::text;
    RETURN;
  END IF;

  -- 被紹介者: Proプランを30日付与（既存のplan_period_endがあれば延長）
  SELECT plan, plan_period_end INTO v_referee_current_plan, v_referee_period_end
  FROM user_profiles
  WHERE id = p_referee_id;

  UPDATE user_profiles
  SET
    plan = 'pro',
    plan_period_end = GREATEST(COALESCE(v_referee_period_end, v_now), v_now) + v_thirty_days,
    referred_by_user_id = v_referrer_id
  WHERE id = p_referee_id;

  -- 紹介者: Proプランを30日延長（既存期限があれば加算）
  UPDATE user_profiles
  SET
    plan = 'pro',
    plan_period_end = GREATEST(COALESCE(plan_period_end, v_now), v_now) + v_thirty_days
  WHERE id = v_referrer_id;

  -- 紹介イベント記録
  INSERT INTO referrals (referrer_id, referee_id, referrer_reward_granted, referee_reward_granted)
  VALUES (v_referrer_id, p_referee_id, true, true);

  RETURN QUERY SELECT true, NULL::text;
END;
$$;
