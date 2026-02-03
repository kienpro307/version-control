# MVM Integration Snippet
# Paste this into ~/.gemini/GEMINI.md (or your IDE's global rules)

## MyVersionManager Auto-Integration

When starting a session in any project workspace:

1. **Check for `.mvm-project` file** in workspace root
2. If exists, read `projectId` from the JSON
3. Use MCP Supabase to query MVM database:
   - Get pending tasks: `SELECT * FROM tasks WHERE project_id = '{id}' AND is_done = false`
   - Get context dump: `SELECT * FROM context_dumps WHERE project_id = '{id}' ORDER BY created_at DESC LIMIT 1`
4. If `context_dumps.next_step_prompt` exists, prioritize that instruction

### Database Schema Reference
| Table | Key Columns |
|-------|-------------|
| `projects` | id, name, progress |
| `tasks` | id, project_id, content, is_done |
| `context_dumps` | id, project_id, mental_model, next_step_prompt |
| `ai_logs` | id, command, status |
