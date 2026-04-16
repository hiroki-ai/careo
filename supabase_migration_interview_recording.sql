-- Interview recordings table
CREATE TABLE interview_recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  interview_id UUID REFERENCES interviews(id) ON DELETE SET NULL,
  company_name TEXT,
  recording_type TEXT NOT NULL CHECK (recording_type IN ('audio_upload', 'text_paste', 'audio_record')),
  transcript TEXT,
  ai_feedback JSONB,
  duration_seconds INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'transcribing', 'analyzing', 'completed', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE interview_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recordings"
  ON interview_recordings FOR ALL
  USING (auth.uid() = user_id);
