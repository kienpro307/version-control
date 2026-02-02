# Supabase MCP Server Setup Guide

## 1. Overview
Để Antigravity AI Agent có thể truy cập trực tiếp vào database Supabase của bạn, chúng ta cần deploy một MCP Server đóng vai trò cầu nối.

Model: `@supabase/mcp-server-supabase`
Hosting: Cloudflare Workers (Miễn phí, nhanh, secure)

## 2. Prerequisites
- Node.js installed
- Cloudflare Account (Free plan ok)
- Supabase Project URL & Anon Key

## 3. Deployment Steps

### Step 3.1: Create Worker Project
```bash
npm create cloudflare@latest mcp-supabase-bridge -- --template worker-typescript
cd mcp-supabase-bridge
```

### Step 3.2: Install Dependencies
```bash
npm install @supabase/supabase-js @modelcontextprotocol/server-cloudflare
```

### Step 3.3: Configure Worker (`src/index.ts`)
*(Sẽ cung cấp code trong file `src/index.ts`)*

### Step 3.4: Deploy
```bash
npx wrangler deploy
```

### 3. Verification
Your MCP Server is now live at:
`https://my-version-manager-mcp.kien307.workers.dev`

You can test it by sending a POST request to `https://my-version-manager-mcp.kien307.workers.dev/` with:
```json
{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
}
```

### Step 3.5: Configure Antigravity
Add to `~/.gemini/antigravity/mcp_settings.json`:
```json
{
  "mcpServers": {
    "supabase-bridge": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/client-sse", "https://your-worker.workers.dev/sse"]
    }
  }
}
```

## 4. MCP Server Implementation Code
(See `docs/MCP_SERVER_CODE.md`)
