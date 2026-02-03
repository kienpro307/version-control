-- =============================================
-- Subtask Migration (Option A: 1-Level Only)
-- Run this AFTER schema.sql
-- =============================================

-- 1. Add parent_id column for subtask relationship
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

-- 2. Add depth column (0 = parent task, 1 = subtask)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS depth INTEGER DEFAULT 0 CHECK (depth >= 0 AND depth <= 1);

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);

-- 4. Constraint function: Prevent grandchildren (max 1 level)
CREATE OR REPLACE FUNCTION check_max_depth() RETURNS TRIGGER AS $$
BEGIN
  -- Nếu task này có parent
  IF NEW.parent_id IS NOT NULL THEN
    -- Check parent có phải là root task không (parent_id = NULL)
    IF EXISTS (
      SELECT 1 FROM tasks 
      WHERE id = NEW.parent_id 
      AND parent_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Chỉ cho phép 1 cấp subtask. Task này không thể là con của một subtask khác.';
    END IF;
    
    -- Set depth = 1 cho subtask
    NEW.depth := 1;
  ELSE
    -- Root task có depth = 0
    NEW.depth := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Apply trigger
DROP TRIGGER IF EXISTS enforce_max_depth ON tasks;
CREATE TRIGGER enforce_max_depth
  BEFORE INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION check_max_depth();

-- 6. Function: Tính progress của parent task từ subtasks
CREATE OR REPLACE FUNCTION calculate_parent_progress(parent_task_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_subtasks INTEGER;
  done_subtasks INTEGER;
BEGIN
  -- Count tổng số subtasks
  SELECT COUNT(*) INTO total_subtasks
  FROM tasks
  WHERE parent_id = parent_task_id;
  
  -- Nếu không có subtasks, return 0
  IF total_subtasks = 0 THEN
    RETURN 0;
  END IF;
  
  -- Count subtasks đã done
  SELECT COUNT(*) INTO done_subtasks
  FROM tasks
  WHERE parent_id = parent_task_id AND is_done = true;
  
  -- Return phần trăm
  RETURN ROUND((done_subtasks::NUMERIC / total_subtasks::NUMERIC) * 100);
END;
$$ LANGUAGE plpgsql;

-- 7. Auto-update parent task when subtask changes
CREATE OR REPLACE FUNCTION update_parent_on_subtask_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Nếu subtask này có parent
  IF NEW.parent_id IS NOT NULL THEN
    -- Log activity
    INSERT INTO activities (
      project_id,
      action_type,
      entity_type,
      entity_id,
      description
    ) VALUES (
      NEW.project_id,
      TG_OP,
      'subtask',
      NEW.id::TEXT,
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'Tạo subtask: ' || NEW.content
        WHEN TG_OP = 'UPDATE' AND NEW.is_done = true THEN 'Hoàn thành subtask: ' || NEW.content
        WHEN TG_OP = 'UPDATE' AND NEW.is_done = false THEN 'Mở lại subtask: ' || NEW.content
        ELSE 'Cập nhật subtask: ' || NEW.content
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_subtask_changes ON tasks;
CREATE TRIGGER log_subtask_changes
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL)
  EXECUTE FUNCTION update_parent_on_subtask_change();

-- 8. Prevent parent task from being marked done if it has incomplete subtasks
CREATE OR REPLACE FUNCTION prevent_parent_done_with_incomplete_subtasks()
RETURNS TRIGGER AS $$
DECLARE
  incomplete_count INTEGER;
BEGIN
  -- Chỉ check khi mark task as done
  IF NEW.is_done = true AND OLD.is_done = false THEN
    -- Check xem có subtasks chưa done không
    SELECT COUNT(*) INTO incomplete_count
    FROM tasks
    WHERE parent_id = NEW.id AND is_done = false;
    
    IF incomplete_count > 0 THEN
      RAISE EXCEPTION 'Không thể đánh dấu parent task hoàn thành khi còn % subtask chưa xong', incomplete_count;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_parent_completion ON tasks;
CREATE TRIGGER check_parent_completion
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  WHEN (NEW.is_done IS DISTINCT FROM OLD.is_done)
  EXECUTE FUNCTION prevent_parent_done_with_incomplete_subtasks();

-- =============================================
-- Verification Queries (run after migration)
-- =============================================

-- Test: Tạo parent task
-- INSERT INTO tasks (project_id, version_id, content) 
-- VALUES ('your-project-id', 'your-version-id', 'Parent Task');

-- Test: Tạo subtask
-- INSERT INTO tasks (project_id, version_id, content, parent_id) 
-- VALUES ('your-project-id', 'your-version-id', 'Subtask 1', 'parent-task-id');

-- Test: Tính progress
-- SELECT calculate_parent_progress('parent-task-id');

-- Test: Lấy tất cả subtasks của parent
-- SELECT * FROM tasks WHERE parent_id = 'parent-task-id';

-- Test: Lấy tất cả root tasks (không có parent)
-- SELECT * FROM tasks WHERE parent_id IS NULL AND version_id = 'your-version-id';

-- =============================================
-- Rollback (if needed)
-- =============================================

-- DROP TRIGGER IF EXISTS enforce_max_depth ON tasks;
-- DROP TRIGGER IF EXISTS log_subtask_changes ON tasks;
-- DROP TRIGGER IF EXISTS check_parent_completion ON tasks;
-- DROP FUNCTION IF EXISTS check_max_depth();
-- DROP FUNCTION IF EXISTS calculate_parent_progress(UUID);
-- DROP FUNCTION IF EXISTS update_parent_on_subtask_change();
-- DROP FUNCTION IF EXISTS prevent_parent_done_with_incomplete_subtasks();
-- DROP INDEX IF EXISTS idx_tasks_parent_id;
-- ALTER TABLE tasks DROP COLUMN IF EXISTS parent_id;
-- ALTER TABLE tasks DROP COLUMN IF EXISTS depth;
