// MVM Setup Script for Other Projects
// Run: node scripts/mvm-setup.js <project-path> <project-uuid>

const fs = require('fs');
const path = require('path');

const [, , targetPath, projectUuid] = process.argv;

if (!targetPath || !projectUuid) {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  MVM Setup - External Memory for AI Agents                    ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Usage: node mvm-setup.js <project-path> <project-uuid>       ║
║                                                               ║
║  Example:                                                     ║
║  node mvm-setup.js D:\\Projects\\AllUpgrade abc-123-def       ║
║                                                               ║
║  Get UUID from: MVM UI → Click project → Copy ID              ║
╚═══════════════════════════════════════════════════════════════╝
`);
    process.exit(1);
}

// 1. Create .mvm-project
const mvmProjectContent = JSON.stringify({ projectId: projectUuid }, null, 2);
fs.writeFileSync(path.join(targetPath, '.mvm-project'), mvmProjectContent);
console.log('✅ Created .mvm-project');

// 2. Create .agent/workflows/mvm.md
const workflowDir = path.join(targetPath, '.agent', 'workflows');
fs.mkdirSync(workflowDir, { recursive: true });

const workflowContent = `---
description: MyVersionManager - External Memory commands cho AI Agent
---

// turbo-all

# MVM Commands

Khi user gọi \\\`/mvm\\\`, thực hiện theo các lệnh sau:

## \\\`/mvm status\\\` hoặc \\\`/mvm\\\`
Đọc \\\`.mvm-project\\\` và hiển thị:
1. Project name và ID
2. Pending tasks
3. Context dump mới nhất (nếu có)

## \\\`/mvm tasks\\\`
Liệt kê tất cả tasks chưa xong của project hiện tại.

## \\\`/mvm add <task>\\\`
Thêm task mới vào MVM. Ví dụ: \\\`/mvm add Fix login bug\\\`

## \\\`/mvm done <task>\\\`
Đánh dấu task là hoàn thành (fuzzy match theo content).

## \\\`/mvm progress <number>\\\`
Cập nhật progress của project. Ví dụ: \\\`/mvm progress 80\\\`

## \\\`/mvm dump\\\`
Tạo context dump với:
- mental_model: Tóm tắt công việc đã làm trong session
- next_step_prompt: Việc cần làm tiếp

## \\\`/mvm resume\\\`
Đọc context dump mới nhất và resume từ \\\`next_step_prompt\\\`.

---

## Advanced Commands

## \\\`/mvm all\\\`
Xem tổng quan TẤT CẢ projects (cross-project dashboard):
- Liệt kê tất cả projects với progress và pending tasks count

## \\\`/mvm suggest\\\`
AI suggest next task dựa trên context và priority.

---

# 🤖 Agent-Driven Task Automation

Khi user yêu cầu thực hiện một công việc (không dùng /mvm command):

## Auto-Task Flow
1. **Detect**: Nhận diện user request là một task cần làm
2. **Create**: Tự động tạo task name ngắn gọn, descriptive
   - Gọi MCP tool \\\`add_task\\\` với \\\`projectId\\\` từ \\\`.mvm-project\\\`
   - Task name format: \\\`[Action] [Target]\\\` (VD: "Fix login validation", "Add dark mode toggle")
3. **Execute**: Thực hiện công việc
4. **Complete**: Khi hoàn thành, gọi \\\`mark_task_done\\\` với task content

## When NOT to Auto-Create Tasks
- Simple questions/explanations
- Code review without changes
- One-liner fixes (< 5 lines changed)

---

## Database
- URL: https://xggrigjnrecjtgfhjpkr.supabase.co
- Tables: \\\`projects\\\`, \\\`tasks\\\`, \\\`context_dumps\\\`, \\\`ai_logs\\\`
`;

fs.writeFileSync(path.join(workflowDir, 'mvm.md'), workflowContent);
console.log('✅ Created .agent/workflows/mvm.md');

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  ✅ MVM Setup Complete!                                       ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Files created:                                               ║
║  - ${targetPath}\\.mvm-project
║  - ${targetPath}\\.agent\\workflows\\mvm.md
║                                                               ║
║  Now you can use: /mvm in this project                        ║
╚═══════════════════════════════════════════════════════════════╝
`);
