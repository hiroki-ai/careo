-- コーチ選択のデバイス間同期対応
-- user_profiles に coach_id カラムを追加

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS coach_id TEXT DEFAULT 'kareo';
