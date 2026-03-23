-- ============================================================
-- Careo Migration: career_center_inquiries
-- キャリアセンター資料請求・お問い合わせテーブル
-- 実行日: 2026-03-24
-- ============================================================

CREATE TABLE IF NOT EXISTS career_center_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  university text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS無効（認証なしで挿入するため service role key で操作）
ALTER TABLE career_center_inquiries DISABLE ROW LEVEL SECURITY;
