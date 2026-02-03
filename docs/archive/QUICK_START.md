# Quick Start: AI Agent Integration

> Hướng dẫn tích hợp MVM làm External Memory cho AI Agents (Antigravity, Cursor, Claude Desktop)

---

## Prerequisites
- MVM đã deploy trên Vercel (production)
- Supabase project với schema đã migrate

---

## Step 1: Add MCP Config (1 lần/máy)

Copy nội dung từ `templates/mcp-supabase-config.json` vào IDE settings:

**Antigravity**: Settings → MCP Servers → Add
**Cursor**: `.cursor/mcp.json` trong home directory
**Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mvm": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "https://xggrigjnrecjtgfhjpkr.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "YOUR_SERVICE_ROLE_KEY"
      }
    }
  }
}
```

> ⚠️ Dùng `service_role` key, KHÔNG dùng `anon` key

---

## Step 2: Create Project Marker (1 lần/project)

Trong mỗi project cần integrate, tạo file `.mvm-project`:

```json
{"projectId": "YOUR_PROJECT_UUID"}
```

**Cách lấy UUID**:
1. Mở MVM UI → Click project
2. Copy UUID từ URL hoặc Project Settings

**Commit file này vào git** để sync giữa các máy.

---

## Step 3: Add GEMINI Snippet (1 lần/máy)

Paste nội dung từ `templates/GEMINI_SNIPPET.md` vào `~/.gemini/GEMINI.md`

Snippet này hướng dẫn AI:
1. Tự động đọc `.mvm-project` khi mở workspace
2. Query MVM lấy context và tasks
3. Resume từ `next_step_prompt` nếu có

---

## Verification

Sau khi setup, mở project trong IDE và hỏi AI:

```
Đọc file .mvm-project và cho tôi biết các task đang pending
```

AI sẽ:
1. Đọc `projectId` từ file
2. Query MVM: `SELECT * FROM tasks WHERE ...`
3. Trả về danh sách tasks

---

## Troubleshooting

| Vấn đề | Giải pháp |
|--------|-----------|
| "MCP server not found" | Restart IDE sau khi add config |
| "Permission denied" | Kiểm tra dùng `service_role` key, không phải `anon` |
| "No data returned" | Kiểm tra `projectId` đúng UUID |
| AI không đọc `.mvm-project` | Kiểm tra GEMINI snippet đã add chưa |
