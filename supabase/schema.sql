-- =============================================
-- My Version Manager - Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Versions table
CREATE TABLE IF NOT EXISTS versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  version_id UUID REFERENCES versions(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  done_at TIMESTAMPTZ,
  position INTEGER DEFAULT 0,
  description TEXT,
  labels TEXT[] DEFAULT '{}',
  priority TEXT DEFAULT 'none'
);

-- 4. Settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  last_project_id UUID REFERENCES projects(id) ON DELETE SET NULL
);

-- =============================================
-- Indexes for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_versions_project ON versions(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_version ON tasks(version_id);

-- =============================================
-- RLS Policies (disabled for personal use)
-- =============================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (personal app)
CREATE POLICY "Allow all for projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for versions" ON versions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 5. Activities table (Audit Log)
-- =============================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_project ON activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for activities" ON activities FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 6. Context Dumps table (Mental Model Store)
-- Stores "brain dumps" for AI Agent context continuity
-- =============================================
CREATE TABLE IF NOT EXISTS context_dumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  mental_model TEXT,                    -- Current logic structure description
  next_step_prompt TEXT,                -- Prompt to "prime" next session
  last_artifacts JSONB DEFAULT '{}',    -- Links/summaries of Antigravity artifacts
  workspace_location TEXT DEFAULT 'office', -- 'office' | 'home'
  is_read BOOLEAN DEFAULT false,        -- Mark as read when loaded
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_context_dumps_project ON context_dumps(project_id);
CREATE INDEX IF NOT EXISTS idx_context_dumps_created ON context_dumps(created_at DESC);

ALTER TABLE context_dumps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for context_dumps" ON context_dumps FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 7. Add diff_summary to activities (for Agent)
-- =============================================
ALTER TABLE activities ADD COLUMN IF NOT EXISTS diff_summary TEXT;
