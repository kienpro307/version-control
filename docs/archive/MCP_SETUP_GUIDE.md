# Supabase MCP Server - Complete Setup Guide

> **Last Updated**: 2026-02-03
> **Status**: ✅ Production Ready

---

## 1. Overview

MCP Server cho phép Antigravity AI Agent truy cập trực tiếp database Supabase.

| Item | Value |
|------|-------|
| **Hosting** | Cloudflare Workers |
| **URL** | `https://my-version-manager-mcp.kien307.workers.dev` |
| **Protocol** | JSON-RPC 2.0 |

---

## 2. Available Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `list_projects` | List all projects | - |
| `get_tasks` | Get pending tasks for a project | `projectId` |
| `read_context_dump` | Read latest context dump | `projectId` |

---

## 3. Configure Antigravity

### Option A: HTTP Transport (Recommended)

Add to `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "version-manager": {
      "url": "https://my-version-manager-mcp.kien307.workers.dev",
      "transport": "http"
    }
  }
}
```

### Option B: SSE Transport

```json
{
  "mcpServers": {
    "version-manager": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-proxy", "https://my-version-manager-mcp.kien307.workers.dev"]
    }
  }
}
```

---

## 4. Test Connection

### 4.1 List Tools
```bash
curl -X POST https://my-version-manager-mcp.kien307.workers.dev/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}'
```

**Expected Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {"name": "list_projects", "description": "List all projects", ...},
      {"name": "get_tasks", ...},
      {"name": "read_context_dump", ...}
    ]
  }
}
```

### 4.2 Call a Tool
```bash
curl -X POST https://my-version-manager-mcp.kien307.workers.dev/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {"name": "list_projects", "arguments": {}},
    "id": 2
  }'
```

---

## 5. Deployment (For Updates)

```bash
cd mcp-server
npm install
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_KEY
npx wrangler deploy
```

---

## 6. Troubleshooting

| Issue | Solution |
|-------|----------|
| `supabaseUrl is required` | Set secrets via `wrangler secret put` |
| Connection timeout | Check Cloudflare Workers status |
| 404 response | Ensure using POST method |

---

## 7. Security Notes

- MCP Server uses Supabase **anon key** (safe for client-side)
- RLS policies control data access
- No sensitive data exposed via MCP
