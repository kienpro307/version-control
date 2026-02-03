# MVM Troubleshooting Guide

## Tasks Not Appearing After Bulk Insert

### Symptoms
- Versions are visible in UI
- Tasks don't appear even after hard refresh
- No errors in console

### Root Cause
**Your bulk insert script likely created versions but failed to create tasks.**

### Diagnosis Steps

#### 1. Verify Data in Supabase
```sql
-- Get project ID
SELECT id, name FROM projects WHERE name LIKE '%YourProject%';

-- Check versions (should see results)
SELECT id, name FROM versions WHERE project_id = 'your-project-id';

-- Check tasks (if empty, this is the problem)
SELECT id, content, version_id FROM tasks WHERE project_id = 'your-project-id';
```

#### 2. Common Mistakes

**Mistake 1: Forgetting to insert tasks**
```typescript
// ❌ BAD: Only creates versions
const { data: version } = await supabase.from('versions').insert({...});
// Missing: task insertion!
```

**Mistake 2: Wrong version_id**
```typescript
// ❌ BAD: Using wrong version reference
await supabase.from('tasks').insert({
    version_id: 'hardcoded-id', // Wrong! Use actual version.id
});
```

**Mistake 3: Silent errors**
```typescript
// ❌ BAD: Not checking error
const { error } = await supabase.from('tasks').insert({...});
// Missing: if (error) throw error;
```

### Fix: Use Bulk Insert Template

See [scripts/bulk-insert-alltranslate.ts](file:///d:/VersionControl/my-version-manager/scripts/bulk-insert-alltranslate.ts) for a correct example.

**Key points:**
1. ✅ Get all versions first
2. ✅ Loop through versions
3. ✅ Check for duplicates before inserting
4. ✅ Use actual `version.id` from query result
5. ✅ Check errors for each insert

### Running the Script

```bash
# 1. Edit the script with your tasks
code scripts/bulk-insert-alltranslate.ts

# 2. Run it
npx ts-node scripts/bulk-insert-alltranslate.ts

# 3. Refresh UI (Ctrl+F5)
```

### Verifying Success

After running, you should see output like:
```
✅ Found 74 versions
📦 Processing Version 74...
  ✅ Added: "Implement feature X"
  ✅ Added: "Fix bug Y"
...
🎉 Done! Created 222 tasks across 74 versions.
```

Then in UI:
1. Open project
2. Expand any version
3. Tasks should appear immediately

---

## SWR Cache Not Refreshing

### Symptoms
- Tasks exist in database
- Don't appear in UI until hard refresh

### Solution
Add refresh button to UI or increase SWR revalidation:

```typescript
// In useTasks.ts
useSWR(key, fetcher, {
    revalidateOnFocus: true,  // Auto-refresh when tab focused
    dedupingInterval: 5000,   // Reduce from 60s to 5s
});
```

---

## Tasks Appear in Wrong Version

### Root Cause
Tasks inserted with wrong `version_id` or `null` version_id.

### Fix
Update existing tasks:
```sql
-- Find orphaned tasks (no version)
SELECT id, content FROM tasks WHERE project_id = 'your-id' AND version_id IS NULL;

-- Assign to active version
UPDATE tasks 
SET version_id = (SELECT id FROM versions WHERE project_id = 'your-id' AND is_active = true LIMIT 1)
WHERE project_id = 'your-id' AND version_id IS NULL;
```

---

## Performance Issues with Many Tasks

### Symptom
UI slow when loading projects with 1000+ tasks.

### Solution
Use pagination in `useTasks`:
```typescript
// Limit initial load
.select('*')
.limit(100)
.order('created_at', { ascending: false });
```

Or filter by active version only:
```typescript
// Only fetch tasks for active version
.eq('version_id', activeVersionId);
```
