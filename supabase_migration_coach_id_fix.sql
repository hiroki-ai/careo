-- Fix: coach_id の DEFAULT を 'kareo' から NULL に変更
-- 理由: DEFAULT 'kareo' だと「明示的に kareo を選んだ」と「未設定」が区別できず、
--       アプリ起動時に Supabase の 'kareo' がlocalStorage の選択値を上書きしてしまうバグが発生する。
-- 対策: DEFAULT を NULL にすることで、未設定ユーザーは localStorage フォールバックを使用し、
--       明示的にコーチを選んだユーザーのみ Supabase で同期する。

-- DEFAULT を NULL に変更
ALTER TABLE user_profiles
  ALTER COLUMN coach_id SET DEFAULT NULL;

-- 既存行のうち DEFAULT 値の 'kareo'（明示的に選択されていないもの）を NULL にリセット
-- ※ 明示的に kareo を選択したユーザーも NULL になるが、アプリ初期値が kareo なので影響なし
UPDATE user_profiles SET coach_id = NULL WHERE coach_id = 'kareo';
