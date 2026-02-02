# Agent-First System - TODO List

> **Mục tiêu**: Biến My Version Manager thành "External Memory" cho Antigravity Ultra
> **Ngày tạo**: 2026-02-02

---

## Phase 1: MCP + Supabase Integration 🔌

### 1.1 Setup Supabase MCP Server (Cloud)

- [x] Research `@supabase/mcp-server-supabase` package
- [x] Tạo Cloudflare Worker / Vercel Edge Function để host MCP server
- [x] Config environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)
- [/] Test connection từ local Antigravity đến MCP server
- [/] Document cách configure MCP trong Antigravity settings

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
- [ ] Update `ActivityDrawer.tsx` hiển thị diff_summary
- [ ] Cho phép edit diff_summary từ UI

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
- [ ] Lưu changelog vào bảng mới hoặc field trong `versions`

---

## Phase 4: Multi-repo Support (Tuist) 📦

> **Note**: Bạn chưa dùng Tuist, nên phase này là research + planning

### 4.1 Research Tuist

- [ ] Đọc docs Tuist: https://docs.tuist.io
- [ ] Hiểu cách Tuist manifest định nghĩa multi-repo
- [ ] So sánh với SPM workspaces hiện tại
- [ ] Quyết định có migrate sang Tuist không

### 4.2 Planning (nếu quyết định dùng Tuist)

- [ ] List 8 repos iOS Native cần quản lý
- [ ] Draft `Project.swift` manifest
- [ ] Tạo migration plan từ SPM → Tuist

---

---

## Phase 5: UI Review & Polish 💅
- [x] 5.1 Polish `ContextDumpModal` (Spacing, Mobile)
- [x] 5.2 Polish `PromptPreviewModal` (Dark mode, Mobile)
- [x] 5.3 Verify Dark Mode Consistency across new features

---

## Phase 6: Daily Workflow Integration 📅

### 5.1 Office Workflow

- [ ] Tạo checklist "Before Leaving Office":
  1. Run context dump cho project đang làm
  2. Update task status
  3. Sync activities
- [ ] Có thể tạo reminder/notification

### 5.2 Home Workflow

- [ ] Tạo "Welcome Back" flow:
  1. Load context dump mới nhất
  2. Hiển thị summary những gì đã làm ở office
  3. Suggest next actions
- [ ] Integrate với ContextBanner

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
| 9 | Phase 5 - Workflow | Low | Medium |

---

## Notes

- **Không dùng API key**: Command Palette sẽ generate prompt → copy → paste vào Antigravity Ultra
- **MCP Server trên Cloud**: Vercel Edge Function hoặc Cloudflare Worker
- **Context Dump = Bộ nhớ ngoài**: Giúp Agent "nhớ" context giữa các phiên làm việc
