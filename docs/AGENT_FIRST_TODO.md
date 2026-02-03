# Agent-First System - TODO List

> **Mục tiêu**: Biến My Version Manager thành "External Memory" cho Antigravity Ultra
> **Ngày tạo**: 2026-02-02

---

## Phase 1: MCP + Supabase Integration 🔌

### 1.1 Setup Supabase MCP Server (Cloud)

- [x] Research `@supabase/mcp-server-supabase` package
- [x] Tạo Cloudflare Worker / Vercel Edge Function để host MCP server
- [x] Config environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)
- [x] Test connection từ local Antigravity đến MCP server
- [x] Document cách configure MCP trong Antigravity settings

### 1.2 Tạo bảng `context_dumps` (Mental Model Store)

- [x] Design schema cho bảng `context_dumps`:
  ```sql
  - project_id: UUID (FK to projects)
  - mental_model: TEXT (mô tả cấu trúc logic hiện tại)
  - next_step_prompt: TEXT (prompt mồi cho phiên sau)
  - last_artifacts: JSONB (links/summaries của artifacts)
  - workspace_location: TEXT ('office' | 'home')
  - created_at: TIMESTAMPTZ
  ```
- [x] Thêm vào `supabase/schema.sql`
- [x] Run migration trên Supabase
- [x] Tạo RLS policy (allow all như các bảng khác)

---

## Phase 2: Context Dumping Workflow 🧠

### 2.1 Backend - API cho Context Dumps

- [x] Tạo hook `useContextDumps.ts`:
  - `createContextDump(projectId, data)`
  - `getLatestContextDump(projectId)`
  - `listContextDumps(projectId, limit)`
- [x] Tạo API endpoint `/api/context-dumps` (nếu cần cho MCP)

### 2.2 Frontend - Context Dump UI

- [x] Thêm nút "Dump Context" vào TopBar hoặc Sidebar
- [x] Tạo modal `ContextDumpModal.tsx`:
  - Form nhập `mental_model` (textarea)
  - Form nhập `next_step_prompt` (textarea)
  - Auto-fill `last_artifacts` từ activities gần nhất
  - Radio button chọn workspace location
- [x] Hiển thị context dump mới nhất khi mở project

### 2.3 Context Loading UI

- [x] Tạo component `ContextBanner.tsx`:
  - Hiện ở đầu trang khi có context dump chưa đọc
  - Nút "Mark as Read" / "Continue from here"
- [x] Integrate với page.tsx

---

## Phase 3: Agent-First Features 🤖

### 3.1 Upgrade Activity Log

- [x] Thêm cột `diff_summary` vào bảng `activities`:
  ```sql
  diff_summary TEXT -- tóm tắt thay đổi logic code
  ```
- [x] Update `useActivities.ts` để support field mới
- [x] Update `ActivityDrawer.tsx` hiển thị diff_summary
- [x] Cho phép edit diff_summary từ UI

### 3.2 Command Palette AI-Native

- [x] Upgrade `CommandPalette.tsx`:
  - Thêm prefix `/agent` để tạo prompt
  - `/agent summarize` → generate prompt tóm tắt project
  - `/agent next-task` → generate prompt hỏi task tiếp theo
  - `/agent context-dump` → mở ContextDumpModal
- [x] Tạo component `PromptPreviewModal.tsx`:
  - Hiển thị prompt đã generate
  - Nút "Copy to Clipboard"
  - Nút "Open in Antigravity" (deep link nếu có)

### 3.3 Automatic Changelog (Manual Input)

- [x] Upgrade `ChangelogModal.tsx`:
  - Thêm textarea "Paste commit messages here"
  - Nút "Generate Changelog" → format commits thành changelog
  - Preview và edit trước khi save
- [x] Lưu changelog vào bảng mới hoặc field trong `versions`

---

## Phase 4: Multi-repo Support (Tuist) 📦 — DEFERRED

> **Status**: Deferred - Không cần thiết cho workflow hiện tại (chỉ 1 main iOS app, modules còn nhỏ, SPM đủ dùng)
> **Revisit khi**: Có 2+ main apps, build time > 10 phút, hoặc team > 1 người

### 4.1 Research Tuist

- [ ] ~~Đọc docs Tuist: https://docs.tuist.io~~ (Deferred)
- [ ] ~~Hiểu cách Tuist manifest định nghĩa multi-repo~~ (Deferred)
- [ ] ~~So sánh với SPM workspaces hiện tại~~ (Deferred)
- [ ] ~~Quyết định có migrate sang Tuist không~~ (Deferred)

### 4.2 Planning (nếu quyết định dùng Tuist)

- [ ] ~~List 8 repos iOS Native cần quản lý~~ (Deferred)
- [ ] ~~Draft `Project.swift` manifest~~ (Deferred)
- [ ] ~~Tạo migration plan từ SPM → Tuist~~ (Deferred)

---

---

## Phase 5: UI Review & Polish 💅
- [x] 5.1 Polish `ContextDumpModal` (Spacing, Mobile)
- [x] 5.2 Polish `PromptPreviewModal` (Dark mode, Mobile)
- [x] 5.3 Verify Dark Mode Consistency across new features

---

## Phase 6: Daily Workflow Integration 📅 ✅

### 5.1 Office Workflow

- [x] Tạo checklist "Before Leaving Office":
  1. Run context dump cho project đang làm
  2. Update task status
  3. Sync activities
- [x] Có thể tạo reminder/notification

### 5.2 Home Workflow

- [x] Tạo "Welcome Back" flow:
  1. Load context dump mới nhất
  2. Hiển thị summary những gì đã làm ở office
  3. Suggest next actions
- [x] Integrate với ContextBanner

---

## Phase 7: AI Integration & Natural Language Commands 🤖✨

> **Goal**: Cho phép nhập lệnh tự nhiên như "Cập nhật tiến độ PDFReader lên 80%"

### 7.1 Database Schema Updates

- [x] Tạo bảng `ai_logs` để lưu lịch sử lệnh AI:
  ```sql
  - command: TEXT (lệnh người dùng nhập)
  - interpreted_action: TEXT (action đã parse)
  - result: JSONB (kết quả thực hiện)
  - status: TEXT ('pending' | 'success' | 'failed')
  - execution_time_ms: INTEGER
  ```
- [x] Thêm cột `progress` (INTEGER) vào bảng `projects`
- [ ] Thêm cột `local_path` (TEXT) vào bảng `projects` (optional, cho file access)
- [x] Run migration trên Supabase

### 7.2 Hooks & API

- [x] Tạo hook `useAILogs.ts`:
  - `createLog(command, action, result, status)`
  - `getRecentLogs(projectId, limit)`
- [x] Update `useProjects.ts`:
  - Thêm `updateProgress(projectId, progress)`
  - Fetch và display `progress` field

### 7.3 Command Parser (Client-side)

- [x] Tạo `src/lib/commandParser.ts`:
  - Parse "Cập nhật tiến độ X lên Y%" → `{ action: 'update_progress', project: 'X', value: Y }`
  - Parse "Thêm task: ABC" → `{ action: 'create_task', content: 'ABC' }`
  - Parse "Hoàn thành task ABC" → `{ action: 'complete_task', taskName: 'ABC' }`
  - Parse "Liệt kê file trong X" → `{ action: 'list_files', project: 'X' }`
- [x] Viết unit tests cho parser

### 7.4 AI Command Bar Component

- [x] Tạo `src/components/AICommandBar.tsx`:
  - Input field style nổi bật (center stage)
  - Placeholder: "Ask AI: Update PDFReader progress to 80%..."
  - Keyboard shortcut: `Cmd+K` để focus
  - Loading state khi đang xử lý
  - History dropdown (lệnh gần đây)
- [x] Integrate vào TopBar hoặc dưới Stats Ribbon

### 7.5 Command Execution Logic

- [x] Tạo `src/lib/commandExecutor.ts`:
  - [x] `executeCommand(parsedCommand)` → gọi hooks tương ứng
  - [x] Log vào `ai_logs` table (handled via MCP/UI)
  - [x] Return success/error message
- [x] Hiển thị toast notification sau khi thực hiện lệnh

### 7.6 MCP Server Updates

- [x] Thêm tool `update_project_progress`:
  - [x] Input: `{ projectId, progress }`
  - [x] Update DB và return success
- [x] Thêm tool `log_ai_action`:
  - [x] Input: `{ command, action, result }`
  - [x] Lưu vào `ai_logs`
- [ ] (Optional) Thêm tool `list_project_files`:
  - Nếu dùng file tree snapshot approach

### 7.7 Dashboard UI Updates

- [x] ~~Hiển thị progress bar cho mỗi project trong Sidebar~~ (Removed per user request)
- [ ] Thêm AI Logs panel vào ActivityDrawer hoặc panel riêng
- [ ] Quick actions từ AI suggestions

---

## Bỏ qua (Agreed to skip)

- ~~PDFReader Reverse Engineering~~ → Đã có ở project khác
- ~~GitLab Auto-Changelog~~ → Không access từ nhà

---

## Priority Order

| # | Phase | Effort | Impact |
|---|-------|--------|--------|
| 1 | Phase 1.2 - Schema context_dumps | Low | High |
| 2 | Phase 2.1 - Hook useContextDumps | Low | High |
| 3 | Phase 2.2 - ContextDumpModal | Medium | High |
| 4 | Phase 1.1 - MCP Server | High | Very High |
| 5 | Phase 3.1 - Activity Log upgrade | Low | Medium |
| 6 | Phase 3.2 - Command Palette | Medium | Medium |
| 7 | Phase 3.3 - Changelog | Low | Low |
| 8 | Phase 4 - Tuist | High | TBD |
| 9 | Phase 6 - Workflow | Low | Medium |
| 10 | **Phase 7.1 - AI Schema** | Low | High |
| 11 | **Phase 7.2-7.3 - Hooks + Parser** | Medium | High |
| 12 | **Phase 7.4-7.5 - AICommandBar** | Medium | Very High |
| 13 | **Phase 7.6 - MCP Updates** | Medium | High |

---

## Notes

- **Không dùng API key**: Command Palette sẽ generate prompt → copy → paste vào Antigravity Ultra
- **MCP Server trên Cloud**: Vercel Edge Function hoặc Cloudflare Worker
- **Context Dump = Bộ nhớ ngoài**: Giúp Agent "nhớ" context giữa các phiên làm việc
- **AI Command Bar**: Parse lệnh tiếng Việt/Anh bằng regex patterns, không cần GPT API

