-- =============================================
-- Agent-First Migration - Context Dumps
-- Run this in Supabase SQL Editor to add Agent-First features
-- =============================================

-- 1. Create context_dumps table (Mental Model Store)
CREATE TABLE IF NOT EXISTS context_dumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  mental_model TEXT,
  next_step_prompt TEXT,
  last_artifacts JSONB DEFAULT '{}',
  workspace_location TEXT DEFAULT 'office',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_context_dumps_project ON context_dumps(project_id);
CREATE INDEX IF NOT EXISTS idx_context_dumps_created ON context_dumps(created_at DESC);

ALTER TABLE context_dumps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for context_dumps" ON context_dumps FOR ALL USING (true) WITH CHECK (true);

-- 2. Add diff_summary column to activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS diff_summary TEXT;

-- Done!
SELECT 'Migration completed: context_dumps table created, diff_summary added to activities' as result;
