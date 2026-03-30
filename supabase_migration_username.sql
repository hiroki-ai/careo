-- ユーザー名カラムの追加
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS username TEXT;
