# MCP Server Integration Guide

> **Mục đích**: Hướng dẫn AI Agents (Antigravity, Cursor, etc.) sử dụng MyVersionManager như External Memory.

> 🚀 **New**: Xem [QUICK_START.md](./QUICK_START.md) để setup trong 3 bước!

---

## Multi-Machine Setup (Recommended)

Nếu bạn có nhiều máy (Office Mac, Home Mac, Windows):

1. **MCP Config**: Add vào mỗi IDE (1 lần/máy)
2. **`.mvm-project`**: Tạo trong mỗi project, commit vào git (auto-sync)
3. **GEMINI Snippet**: Add vào `~/.gemini/GEMINI.md` (1 lần/máy)

Xem chi tiết: [QUICK_START.md](./QUICK_START.md)

---

## Tổng quan


MyVersionManager (MVM) cung cấp 2 phương thức để AI Agents tương tác:

| Phương thức | Khi nào dùng | Ưu điểm |
|-------------|-------------|---------|
| **REST API** | Gọi từ bất kỳ môi trường nào | Đơn giản, universal |
| **MCP Server** | IDE hỗ trợ MCP (Antigravity) | Native integration |

---

## 1. REST API (Khuyến nghị)

### Base URL
```
Production: https://my-version-manager.vercel.app/api
Local:      http://localhost:3000/api
```

### Authentication
```http
Authorization: Bearer mvm_sk_live_YOUR_API_KEY
```

---

### Endpoints

#### 📁 Projects

**List all projects**
```bash
GET /api/projects
```

**Create project**
```bash
POST /api/projects
Content-Type: application/json

{
  "name": "iOS/XTranslate"
}
```

**Update project progress**
```bash
PATCH /api/projects/{id}
Content-Type: application/json

{
  "progress": 75
}
```

---

#### ✅ Tasks

**Get tasks for a project**
```bash
GET /api/projects/{projectId}/tasks
```

**Create task**
```bash
POST /api/projects/{projectId}/tasks
Content-Type: application/json

{
  "content": "Implement login screen",
  "versionId": "optional-version-uuid"
}
```

**Complete task**
```bash
PATCH /api/tasks/{taskId}
Content-Type: application/json

{
  "isDone": true
}
```

---

#### 📦 Versions

**List versions for a project**
```bash
GET /api/projects/{projectId}/versions
```

**Create version**
```bash
POST /api/projects/{projectId}/versions
Content-Type: application/json

{
  "name": "v1.0 - Initial Release",
  "isActive": true
}
```

---

#### 🧠 Context Dumps (cho AI continuity)

**Get latest context dump**
```bash
GET /api/projects/{projectId}/context
```

**Create context dump**
```bash
POST /api/projects/{projectId}/context
Content-Type: application/json

{
  "mental_model": "Đang implement feature X, file Y đã xong...",
  "next_step_prompt": "Tiếp tục với file Z, cần test ở browser...",
  "workspace_location": "office"
}
```

---

## 2. MCP Integration (Recommended) 🚀

Cách dễ nhất là sử dụng package chính thức `@supabase/mcp-server-supabase`. Không cần deploy bất kỳ code nào.

### Cấu hình trong Cursor / Claude / Antigravity

Thêm vào file config MCP của IDE:

```json
{
  "mcpServers": {
    "my-version-manager": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase"
      ],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJ..."
      }
    }
  }
}
```

### Tại sao nên dùng cách này?
- **Zero Deployment**: Chạy trực tiếp qua `npx`, không cần host Worker.
- **Full Access**: AI có thể query mọi bảng (tasks, projects, logs) bằng SQL hoặc REST tools.
- **Security**: Key được lưu trong IDE, không lộ ra public.

---

### Mẫu Prompt cho AI Agent

Khi bắt đầu session, hãy cung cấp context này cho AI:

```markdown
# MyVersionManager Context
Bạn có quyền truy cập database quản lý task qua MCP Supabase.

## Database Schema
- `projects`: id, name, progress
- `tasks`: id, project_id, content, is_done
- `context_dumps`: id, mental_model, next_step_prompt

## Nhiệm vụ
- Đầu buổi: Query `tasks` chưa xong của project hiện tại.
- Cuối buổi: Insert `context_dumps` mới và update `progress`.

## Project IDs
- iOS/XTranslate: `...`
- Web/MVM: `1601b9ca-f19c-4bd6-97ba-9f41de6c2a0d`
```

---

## 3. Ví dụ thực tế: Node.js Script

```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_KEY = 'eyJhbGc...';

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Thêm task mới
async function addTask(projectId, versionId, content) {
    const { data, error } = await supabase
        .from('tasks')
        .insert({ project_id: projectId, version_id: versionId, content, is_done: false })
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

// Cập nhật progress
async function updateProgress(projectId, progress) {
    const { error } = await supabase
        .from('projects')
        .update({ progress })
        .eq('id', projectId);
    
    if (error) throw error;
}

// Usage
addTask('project-uuid', 'version-uuid', 'Fix login bug');
updateProgress('project-uuid', 80);
```

---

## 4. Database Schema Reference

### projects
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Format: "Folder/ProjectName" |
| `progress` | INTEGER | 0-100 |
| `created_at` | TIMESTAMPTZ | - |

### tasks
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `project_id` | UUID | FK to projects |
| `version_id` | UUID | FK to versions (optional) |
| `content` | TEXT | Task description |
| `is_done` | BOOLEAN | - |
| `done_at` | TIMESTAMPTZ | When completed |

### versions
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `project_id` | UUID | FK to projects |
| `name` | TEXT | e.g. "v1.0 - Initial" |
| `is_active` | BOOLEAN | Current working version |
| `changelog` | TEXT | Release notes |

### context_dumps
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `project_id` | UUID | FK to projects |
| `mental_model` | TEXT | Current understanding |
| `next_step_prompt` | TEXT | Prompt for next session |
| `workspace_location` | TEXT | 'office' or 'home' |
| `is_read` | BOOLEAN | Mark when loaded |

### ai_logs
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `command` | TEXT | Original command |
| `interpreted_action` | TEXT | Parsed action |
| `result` | JSONB | Execution result |
| `status` | TEXT | 'success' / 'failed' |
| `execution_time_ms` | INTEGER | - |

---

## 5. Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Kiểm tra API key trong header |
| Column not found | Schema chưa migrate, chạy lại `schema.sql` |
| CORS error | Chỉ xảy ra khi gọi từ browser, dùng backend proxy |
| Empty response | Kiểm tra project_id/version_id có tồn tại |

---

## 6. Quick Reference

```bash
# Lấy danh sách projects
curl -H "Authorization: Bearer $API_KEY" https://my-version-manager.vercel.app/api/projects

# Thêm task
curl -X POST -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"content": "New task"}' \
     https://my-version-manager.vercel.app/api/projects/{id}/tasks

# Cập nhật progress
curl -X PATCH -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"progress": 75}' \
     https://my-version-manager.vercel.app/api/projects/{id}
```
