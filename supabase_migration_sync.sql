-- デバイス間データ同期のためのカラム追加
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS last_pdca JSONB,
  ADD COLUMN IF NOT EXISTS last_pdca_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_chat_at TIMESTAMPTZ;
