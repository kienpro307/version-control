# Example: Verification Output

When testing MCP connection in Step 4.3, you should see output similar to this:

## ✅ Successful Output

```
AI: I'll read the .mvm-project file and query the database.

[Reading file: .mvm-project]
Found project ID: abc123-def456-789...

[Querying MVM database via MCP]
SELECT * FROM tasks 
WHERE project_id = 'abc123-def456-789' 
AND is_done = false 
ORDER BY created_at

Result: No pending tasks found for this project.
```

## Alternative: If Tasks Exist

```
AI: Found 3 pending tasks:

1. [v1.0] Implement user authentication
2. [v1.0] Set up database migrations  
3. [v2.0] Add password reset feature
```

## ❌ Error: MCP Not Configured

```
AI: I cannot access the MVM database. The MCP server "mvm" is not configured.

Please follow these steps:
1. Open Settings → MCP Servers
2. Add the Supabase MCP server configuration
3. Restart the application
```

## ❌ Error: Invalid Project ID

```
AI: Read project ID: abc123-def456-789

[Querying database...]
Error: No project found with ID 'abc123-def456-789'

Please verify:
- The UUID in .mvm-project matches a project in your MVM dashboard
- You created the project via the web app first
```

## JSON Output Format

The `.mvm-project` file should contain valid JSON:

```json
{
  "projectId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Windows PowerShell command to create:**
```powershell
# Replace YOUR_UUID with actual project UUID from dashboard
# Using UTF-8 without BOM to prevent JSON parse errors
$content = '{\"projectId\":\"YOUR_UUID\"}'
[System.IO.File]::WriteAllText(\".mvm-project\", $content, [System.Text.UTF8Encoding]::new($false))
```

**Mac/Linux command:**
```bash
echo '{"projectId":"YOUR_UUID"}' > .mvm-project
```
