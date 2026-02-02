-- Add position column to tasks table for ordering
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Optional: Update existing tasks to have sequential positions
-- distinct project_id partition logic if needed, but simplistic approach for now
WITH ranked_tasks AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY version_id ORDER BY created_at) as rn
  FROM tasks
)
UPDATE tasks
SET position = ranked_tasks.rn
FROM ranked_tasks
WHERE tasks.id = ranked_tasks.id;
