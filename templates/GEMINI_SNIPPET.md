# MVM Integration Snippet
# Paste this into ~/.gemini/GEMINI.md (or your IDE's global rules)

## MyVersionManager Auto-Integration

When starting a session in any project workspace:

1. **Check for `.mvm-project` file** in workspace root
2. If exists, read `projectId` from the JSON
3. Use MCP Supabase to query MVM database:
   - Get pending tasks: `SELECT * FROM tasks WHERE project_id = '{id}' AND is_done = false ORDER BY created_at`
   - Get context dump: `SELECT * FROM context_dumps WHERE project_id = '{id}' ORDER BY created_at DESC LIMIT 1`
4. If `context_dumps.next_step_prompt` exists, prioritize that instruction

### Database Schema Reference
| Table | Key Columns |
|-------|-------------|
| `projects` | id, name, progress, local_path |
| `versions` | id, project_id, name, is_active |
| `tasks` | id, project_id, version_id, content, is_done, priority |
| `context_dumps` | id, project_id, mental_model, next_step_prompt, workspace_location |
| `ai_logs` | id, command, status, execution_time_ms |
| `activities` | id, project_id, activity_type, description, diff_summary |

### Example Queries

**Get tasks by version:**
```sql
SELECT t.*, v.name as version_name 
FROM tasks t 
LEFT JOIN versions v ON t.version_id = v.id 
WHERE t.project_id = '{id}' AND t.is_done = false
```

**Get high-priority tasks:**
```sql
SELECT * FROM tasks 
WHERE project_id = '{id}' 
  AND is_done = false 
  AND priority IN ('high', 'medium')
ORDER BY priority DESC, created_at
```

**Load session context:**
```sql
SELECT mental_model, next_step_prompt, workspace_location 
FROM context_dumps 
WHERE project_id = '{id}' 
ORDER BY created_at DESC 
LIMIT 1
```

### Error Handling

If `.mvm-project` file is missing or malformed:
- Don't fail silently
- Ask user: "Would you like to integrate MVM for this project?"
- Guide them to create `.mvm-project` with correct UUID

If MCP query fails:
- Check MCP server is configured (see [MCP_INTEGRATION.md](https://github.com/kienpro307/version-control/blob/main/docs/MCP_INTEGRATION.md))
- Verify `projectId` is valid UUID
- Suggest manual verification in MVM dashboard

---

For full setup guide, see: [docs/GETTING_STARTED.md](https://github.com/kienpro307/version-control/blob/main/docs/GETTING_STARTED.md)

