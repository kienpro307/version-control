-- =============================================
-- My Version Manager - API Schema Migration
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Project Groups table (hierarchical)
CREATE TABLE IF NOT EXISTS project_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES project_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add group_id to projects (ignore error if column already exists)
DO $$ 
BEGIN
  ALTER TABLE projects ADD COLUMN group_id UUID REFERENCES project_groups(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- 3. Index for performance
CREATE INDEX IF NOT EXISTS idx_project_groups_parent ON project_groups(parent_id);
CREATE INDEX IF NOT EXISTS idx_projects_group ON projects(group_id);

-- 4. RLS for project_groups
ALTER TABLE project_groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists, then create
DROP POLICY IF EXISTS "Allow all for project_groups" ON project_groups;
CREATE POLICY "Allow all for project_groups" ON project_groups FOR ALL USING (true) WITH CHECK (true);
