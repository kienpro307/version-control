---
description: MyVersionManager - External Memory commands cho AI Agent
---

// turbo-all

# MVM Commands

Khi user gọi `/mvm`, thực hiện theo các lệnh sau:

## `/mvm status` hoặc `/mvm`
Đọc `.mvm-project` và hiển thị:
1. Project name và ID
2. Pending tasks
3. Context dump mới nhất (nếu có)

## `/mvm tasks`
Liệt kê tất cả tasks chưa xong của project hiện tại.

## `/mvm add <task>`
Thêm task mới vào MVM. Ví dụ: `/mvm add Fix login bug`

## `/mvm done <task>`
Đánh dấu task là hoàn thành (fuzzy match theo content).

## `/mvm progress <number>`
Cập nhật progress của project. Ví dụ: `/mvm progress 80`

## `/mvm dump`
Tạo context dump với:
- mental_model: Tóm tắt công việc đã làm trong session
- next_step_prompt: Việc cần làm tiếp

## `/mvm resume`
Đọc context dump mới nhất và resume từ `next_step_prompt`.

---

## Advanced Commands

## `/mvm all`
Xem tổng quan TẤT CẢ projects (cross-project dashboard):
- Liệt kê tất cả projects với progress và pending tasks count

## `/mvm suggest`
AI suggest next task dựa trên context và priority.

---

# 🤖 Agent-Driven Task Automation

Khi user yêu cầu thực hiện một công việc (không dùng /mvm command):

## Auto-Task Flow
1. **Detect**: Nhận diện user request là một task cần làm
2. **Create**: Tự động tạo task name ngắn gọn, descriptive
   - Gọi MCP tool `add_task` với `projectId` từ `.mvm-project`
   - Task name format: `[Action] [Target]` (VD: "Fix login validation", "Add dark mode toggle")
3. **Execute**: Thực hiện công việc
4. **Complete**: Khi hoàn thành, gọi `mark_task_done` với task content

## Example Flow
```
User: "Thêm nút logout vào sidebar"

AI Actions:
1. add_task(projectId, "Add logout button to Sidebar")
2. [Edit Sidebar.tsx, add button, test]
3. mark_task_done(projectId, "Add logout button to Sidebar")
4. Notify user: "✅ Done: Added logout button to Sidebar"
```

## When NOT to Auto-Create Tasks
- Simple questions/explanations
- Code review without changes
- One-liner fixes (< 5 lines changed)

---

## Database
- URL: https://xggrigjnrecjtgfhjpkr.supabase.co
- Tables: `projects`, `tasks`, `context_dumps`, `ai_logs`
