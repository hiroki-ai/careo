-- MyPage ID/Password Manager: Company mypage credentials (encrypted client-side)
-- Note: mypage_url already exists in companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS mypage_login_id TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS mypage_password_encrypted TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS mypage_notes TEXT;

-- ES Data Accumulation & Analytics: ES success tracking for community insights
ALTER TABLE es_entries ADD COLUMN IF NOT EXISTS result TEXT CHECK (result IN ('passed', 'failed', 'pending', 'unknown')) DEFAULT 'unknown';
ALTER TABLE es_entries ADD COLUMN IF NOT EXISTS is_shared_anonymously BOOLEAN DEFAULT false;

-- Aggregated ES insights view (anonymized)
CREATE OR REPLACE VIEW es_community_insights AS
SELECT
  eq.question,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE ee.result = 'passed') as passed_count,
  ROUND(COUNT(*) FILTER (WHERE ee.result = 'passed')::numeric / NULLIF(COUNT(*), 0) * 100) as pass_rate
FROM es_questions eq
JOIN es_entries ee ON eq.es_id = ee.id
WHERE ee.is_shared_anonymously = true
GROUP BY eq.question
HAVING COUNT(*) >= 3;
