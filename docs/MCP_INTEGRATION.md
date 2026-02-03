# MCP Integration Guide

> **Connect AI agents to My Version Manager's database**

This guide covers MCP (Model Context Protocol) setup for direct database access from AI agents like Antigravity, Cursor, and Claude Desktop.

---

## What is MCP?

**Model Context Protocol** allows AI agents to:
- Query your Supabase database directly
- Read tasks, projects, and context dumps
- Execute operations without API authentication

Think of it as a "read-only database connection" for your AI.

---

## Prerequisites

Before proceeding, ensure you have:
- [ ] MVM deployed to Vercel ([GETTING_STARTED.md](GETTING_STARTED.md))
- [ ] Supabase project set up with migrations
- [ ] Supabase **service_role** key (from Settings → API)
- [ ] AI agent installed (Antigravity, Cursor, or Claude Desktop)

---

## Recommended Approach: Supabase MCP via npx

We use the official [@supabase/mcp-server-supabase](https://www.npmjs.com/package/@supabase/mcp-server-supabase) package.

**Why this approach?**
- ✅ Zero local setup (npx auto-installs)
- ✅ Official Supabase support
- ✅ Works with all MCP-compatible agents
- ✅ No intermediate server needed

---

## Step-by-Step Setup

### Step 1: Get Supabase Credentials

1. Go to your Supabase dashboard
2. Navigate to **Settings** → **API**
3. Copy these two values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **`service_role` key** (NOT the `anon` key!)

> ⚠️ **Important**: Use `service_role` key for MCP. The `anon` key has limited permissions.

---

### Step 2: Configure Your AI Agent

<details open>
<summary><h3>Antigravity (Recommended)</h3></summary>

#### Via UI Settings
1. Open Antigravity
2. Go to **Settings** (⚙️ icon)
3. Click **MCP Servers** tab
4. Click **"Add Server"**
5. Fill in the form:
   - **Server Name**: `mvm`
   - **Command**: `npx`
   - **Arguments** (add separately):
     - First arg: `-y`
     - Second arg: `@supabase/mcp-server-supabase`
   - **Environment Variables** (click "Add Environment Variable"):
     - Key: `SUPABASE_URL`, Value: Your Supabase URL
     - Key: `SUPABASE_SERVICE_ROLE_KEY`, Value: Your service_role key
6. Click **"Save"**
7. **Restart Antigravity**

#### Via Config File (Alternative)
Edit `C:\Users\<YourName>\.gemini\antigravity\mcp_config.json`:

```json
{
  "mcpServers": {
    "mvm": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "https://xxxxx.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGc..."
      }
    }
  }
}
```

Restart Antigravity after saving.
</details>

<details>
<summary><h3>Cursor</h3></summary>

1. Create/edit MCP config file:
   - **Windows**: `C:\Users\<YourName>\.cursor\mcp.json`
   - **macOS/Linux**: `~/.cursor/mcp.json`

2. Copy template from [`templates/mcp-config.json`](../templates/mcp-config.json):

```json
{
  "mcpServers": {
    "mvm": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "YOUR_SUPABASE_URL_HERE",
        "SUPABASE_SERVICE_ROLE_KEY": "YOUR_SERVICE_ROLE_KEY_HERE"
      }
    }
  }
}
```

3. Replace placeholders with your actual values
4. Save and restart Cursor
</details>

<details>
<summary><h3>Claude Desktop</h3></summary>

1. Locate config file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add MCP server config:

```json
{
  "mcpServers": {
    "mvm": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "https://xxxxx.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGc..."
      }
    }
  }
}
```

3. Save and restart Claude Desktop
4. You should see "MVM" in available tools
</details>

---

### Step 3: Enable Auto-Detection (Optional)

This makes AI automatically detect MVM projects without manual prompts.

1. Copy content from [`templates/GEMINI_SNIPPET.md`](../templates/GEMINI_SNIPPET.md)
2. Paste into your agent's global instructions:

| AI Agent | Location |
|----------|----------|
| **Antigravity** | `~/.gemini/GEMINI.md` |
| **Cursor** | `~/.cursor/prompts/global.md` |
| **Claude Desktop** | Settings → Custom Instructions |

This snippet tells the AI to:
- Check for `.mvm-project` files on workspace open
- Automatically query pending tasks
- Load context dumps for session resumption

---

## Verification

### Test 1: Basic MCP Connection

Open your AI agent and ask:

```
List all available MCP tools for "mvm" server
```

**Expected response:**
```
Available tools:
- query (Execute SQL queries)
- schema (View database schema)
- ... (other Supabase MCP tools)
```

### Test 2: Query MVM Database

```
Query the mvm database: SELECT * FROM projects LIMIT 5
```

**Expected response:**
```
Found X projects:
1. Project Name 1 (UUID: abc-123...)
2. Project Name 2 (UUID: def-456...)
...
```

### Test 3: Project Context Loading

1. Create a `.mvm-project` file in a test folder:
```json
{"projectId":"YOUR_PROJECT_UUID"}
```

2. Open that folder in your AI agent
3. Ask: `"What pending tasks does this project have?"`

**Expected behavior:**
- AI reads `.mvm-project`
- Queries `SELECT * FROM tasks WHERE project_id = '...' AND is_done = false`
- Returns task list (or "No pending tasks")

If all three tests pass, your MCP integration is working! ✅

---

## Advanced Usage

### Custom Queries

Since MCP provides direct SQL access, you can ask complex questions:

```
Query mvm: SELECT version_id, COUNT(*) as task_count 
FROM tasks WHERE project_id = 'abc-123' 
GROUP BY version_id
```

### Context Dump Loading

```
Get the latest context dump for project abc-123
```

AI will query:
```sql
SELECT * FROM context_dumps 
WHERE project_id = 'abc-123' 
ORDER BY created_at DESC 
LIMIT 1
```

---

## Troubleshooting

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| "MCP server 'mvm' not found" | Config not loaded | Restart AI agent after adding config |
| "Permission denied" | Wrong key type | Use `service_role` key, not `anon` key |
| "Connection timeout" | Network/firewall | Check internet connection, disable VPN |
| "Module not found: @supabase/mcp-server-supabase" | npx cache issue | Clear npm cache: `npm cache clean --force` |
| AI doesn't auto-detect `.mvm-project` | Missing global snippet | Add GEMINI_SNIPPET to global rules (Step 3) |
| "Invalid SQL syntax" | Incorrect query | Check Supabase schema in dashboard |

### Debug Mode

To see MCP communication logs:

**Antigravity:**
1. Settings → Advanced → Enable Debug Logs
2. View logs in: `~/.gemini/logs/mcp.log`

**Cursor:**
- Check Developer Console (Help → Toggle Developer Tools)

---

## Security Notes

### What MCP Can Access

With `service_role` key, MCP has **full database access**:
- ✅ Read all tables
- ✅ Insert/update/delete rows
- ✅ Bypass RLS policies

### Best Practices

1. **Never share `service_role` key publicly**
2. **Don't commit MCP config to git** (add to `.gitignore`)
3. **Use separate Supabase project** for testing vs production
4. **Monitor usage** in Supabase dashboard → Logs

### Alternative: Read-Only Access

If you prefer read-only access, create a custom PostgreSQL role:

```sql
-- In Supabase SQL Editor
CREATE ROLE mvm_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mvm_readonly;
-- Create a key with this role (see Supabase docs)
```

Then use that key in MCP config instead of `service_role`.

---

## Alternative Approach: Cloudflare Workers MCP

If you prefer a hosted MCP server (no local npx):

1. See [`mcp-server/`](../mcp-server/) directory for Cloudflare Workers setup
2. Deploy MCP server to Cloudflare
3. Use HTTP transport instead of stdio

**Pros:**
- No local dependencies
- Faster startup
- Better for teams

**Cons:**
- Requires Cloudflare account
- Extra deployment step

Detailed guide: [MCP_SERVER_CODE.md](MCP_SERVER_CODE.md)

---

## Next Steps

Now that MCP is working:

1. **Create `.mvm-project` files** in your active projects
2. **Use AI to manage tasks**: "Add a task to implement user auth"
3. **Create context dumps**: "Summarize today's work and create a context dump"
4. **Auto-resume sessions**: AI will load context on next open

See [GETTING_STARTED.md](GETTING_STARTED.md) for workflow examples.

---

## Support

- [GitHub Issues](https://github.com/kienpro307/version-control/issues)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [API Documentation](API.md)
