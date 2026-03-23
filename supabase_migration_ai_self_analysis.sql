-- AIが生成した自己分析を別フィールドで保持（ユーザー入力を上書きしない）
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS ai_self_analysis JSONB DEFAULT '{}';
