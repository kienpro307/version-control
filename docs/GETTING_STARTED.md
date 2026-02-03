# Getting Started with My Version Manager

> **Complete setup guide from zero to deployed** (≈ 20 minutes)

This guide will walk you through:
1. Setting up Supabase database
2. Deploying to Vercel
3. Connecting AI agents via MCP
4. Verifying integration

---

## Prerequisites

Before starting, make sure you have:

- [ ] Node.js 18+ installed
- [ ] GitHub account (for Vercel deployment)
- [ ] A code editor (VS Code recommended)
- [ ] AI agent with MCP support (Antigravity, Cursor, or Claude Desktop)

**Accounts to create** (both have free tiers):
- [ ] [Supabase account](https://supabase.com)
- [ ] [Vercel account](https://vercel.com)

---

## Step 1: Database Setup (Supabase)

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New project"**
3. Fill in:
   - **Name**: `my-version-manager` (or any name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to you
4. Click **"Create new project"** (takes ~2 minutes)

### 1.2 Run Database Migrations

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy contents from [`supabase/schema.sql`](../supabase/schema.sql) in this repo
4. Paste and click **"Run"**
5. Repeat for [`supabase/migration_groups.sql`](../supabase/migration_groups.sql)

You should see: ✅ `Success. No rows returned`

### 1.3 Get API Credentials

1. Go to **Settings** → **API** (left sidebar)
2. Copy these values (you'll need them later):
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJhbGc...`)
   - **service_role** key (starts with `eyJhbGc...`, longer)

> ⚠️ **Keep `service_role` key secret!** Never commit it to git.

---

## Step 2: Deploy to Vercel

### 2.1 Fork/Clone Repository

**Option A: Fork on GitHub** (recommended)
1. Go to [github.com/kienpro307/version-control](https://github.com/kienpro307/version-control)
2. Click **"Fork"** (top right)
3. Wait for fork to complete

**Option B: Clone locally**
```bash
git clone https://github.com/kienpro307/version-control.git
cd my-version-manager
npm install
```

### 2.2 Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your forked repository
4. In **"Configure Project"**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./`
   - Click **"Environment Variables"**

5. Add these variables:

| Key | Value | Where to get it |
|-----|-------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` (anon key) | Supabase → Settings → API |
| `API_SECRET_KEY` | Generate a strong key (see below) | Generate yourself |

6. Click **"Deploy"** (takes ~3 minutes)

### 2.3 Generate API Key

**On Windows (PowerShell):**
```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
"mvm_sk_live_" + [Convert]::ToBase64String($bytes).Replace("+", "A").Replace("/", "B").Substring(0, 32)
```

**On Mac/Linux:**
```bash
openssl rand -base64 32 | tr -d '\n' | sed 's/^/mvm_sk_live_/'
```

Copy the output and paste it as `API_SECRET_KEY` in Vercel.

### 2.4 Verify Deployment

After deployment completes:
1. Click **"Visit"** to open your app
2. You should see the MVM dashboard
3. Try creating a project manually to test

Your app is now live! 🎉

---

## Step 3: MCP Integration (AI Agent Setup)

This step connects your AI agent to MVM's database.

### 3.1 Get Supabase Service Role Key

1. Go to Supabase → **Settings** → **API**
2. Copy the **`service_role`** key (⚠️ different from `anon` key!)

### 3.2 Configure Your AI Agent

Choose your AI agent:

<details>
<summary><b>Antigravity</b></summary>

1. Open **Settings** → **MCP Servers**
2. Click **"Add Server"**
3. Fill in:
   - **Name**: `mvm`
   - **Command**: `npx`
   - **Args**: `-y`, `@supabase/mcp-server-supabase`
   - **Environment Variables**:
     - `SUPABASE_URL`: Your Supabase URL
     - `SUPABASE_SERVICE_ROLE_KEY`: Your service_role key
4. Click **"Save"**
5. **Restart Antigravity**
</details>

<details>
<summary><b>Cursor</b></summary>

1. Create file: `~/.cursor/mcp.json` (macOS/Linux) or `C:\Users\<YourName>\.cursor\mcp.json` (Windows)
2. Copy from [`templates/mcp-config.json`](../templates/mcp-config.json)
3. Replace placeholders:
   - `YOUR_SUPABASE_URL_HERE` → Your Supabase URL
   - `YOUR_SERVICE_ROLE_KEY_HERE` → Your service_role key
4. Save and restart Cursor
</details>

<details>
<summary><b>Claude Desktop</b></summary>

1. Edit config file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
2. Copy from [`templates/mcp-config.json`](../templates/mcp-config.json)
3. Replace placeholders
4. Save and restart Claude Desktop
</details>

### 3.3 Add Global AI Instructions (Optional but Recommended)

This makes AI automatically detect MVM projects.

1. Copy content from [`templates/GEMINI_SNIPPET.md`](../templates/GEMINI_SNIPPET.md)
2. Paste into your AI agent's global rules:
   - **Antigravity**: `~/.gemini/GEMINI.md`
   - **Cursor**: `~/.cursor/prompts/global.md`
   - **Claude Desktop**: Settings → Custom Instructions

---

## Step 4: Verification

### 4.1 Create a Test Project in MVM

1. Open your deployed MVM app (Vercel URL)
2. Click **"+ New Project"**
3. Name it: `Test MVM Integration`
4. Click **"Create"**
5. Copy the **Project UUID** from the URL bar (e.g., `abc123-def456-...`)

### 4.2 Create `.mvm-project` File

In any local directory:

```bash
# Create a test folder
mkdir mvm-test-project
cd mvm-test-project

# Create marker file
echo '{"projectId":"PASTE_YOUR_UUID_HERE"}' > .mvm-project
```

Replace `PASTE_YOUR_UUID_HERE` with the UUID from step 4.1.

### 4.3 Test MCP Connection

1. **Open the `mvm-test-project` folder in your AI agent**
2. Ask: `"Read .mvm-project and list all pending tasks"`

**Expected behavior:**
- AI reads the `projectId` from `.mvm-project`
- Queries MVM database via MCP
- Returns: `"No pending tasks found"` (since it's a new project)

**If you see this, setup is complete!** ✅

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "MCP server not found" | Restart your AI agent after adding MCP config |
| "Permission denied" | Make sure you used `service_role` key, not `anon` key |
| "Invalid project ID" | Check the UUID matches exactly from MVM dashboard |
| AI doesn't read `.mvm-project` | Add the GEMINI snippet to global rules (Step 3.3) |

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for more issues.

---

## Next Steps

Now that MVM is set up:

1. **Create real projects** in MVM dashboard
2. **Add `.mvm-project` to your repos** (commit it to git for team sync)
3. **Use AI to manage tasks**: "Add task: Implement login page"
4. **Create context dumps**: "Create a context dump for today's work"

---

## Additional Resources

- [MCP Integration Deep Dive](MCP_INTEGRATION.md)
- [API Documentation](API.md)
- [Deployment Guide](SETUP.md)
- [Troubleshooting](TROUBLESHOOTING.md)

---

## Support

Need help?
- [GitHub Issues](https://github.com/kienpro307/version-control/issues)
- [Discord Community](#) (coming soon)
