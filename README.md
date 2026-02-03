# My Version Manager (MVM)

> **External Memory System for AI Agents**  
> Track multi-version projects, context dumps, and task workflows with intelligent AI integration.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kienpro307/version-control)

---

## 🎯 What is MVM?

MVM is a **project management system designed for AI-assisted development**. It helps AI agents maintain context across sessions by:

- **Version-based task tracking** (v1.0, v2.0, etc.)
- **Context dumps** with mental models and next-step prompts
- **Activity logging** for changelogs and retrospectives
- **Direct database access** via Model Context Protocol (MCP)

---

## ✨ Key Features

### 1. Multi-Version Task Management
- Organize tasks by version/milestone
- Automatic progress tracking
- Drag-and-drop reordering
- Bulk operations

### 2. AI Agent Integration
- **MCP Server** for direct Supabase access
- Auto-resume from context dumps
- AI command logging
- Task automation

### 3. Changelog Generation
- AI-powered changelog from activities
- Diff summaries for code changes
- Version-based filtering

### 4. Local File Access
- Link projects to local directories
- AI can list project files
- Cross-machine sync via MCP

---

## 🚀 Quick Start

### For New Users

1. **[Deploy & Setup](docs/GETTING_STARTED.md)** - Complete setup guide (Supabase + Vercel)
2. **[MCP Integration](docs/MCP_INTEGRATION.md)** - Connect to AI agents (Antigravity/Cursor/Claude Desktop)
3. **[Verify Setup](#verify-integration)** - Test with sample queries

### For Developers

```bash
# Clone repository
git clone https://github.com/kienpro307/version-control.git
cd my-version-manager

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
# See GETTING_STARTED.md for detailed setup

# Run locally
npm run dev
# Open http://localhost:3000
```

See [SETUP.md](docs/SETUP.md) for detailed development instructions.

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [GETTING_STARTED.md](docs/GETTING_STARTED.md) | End-to-end setup for new users |
| [MCP_INTEGRATION.md](docs/MCP_INTEGRATION.md) | Connect AI agents to MVM |
| [SETUP.md](docs/SETUP.md) | Local development & deployment |
| [API.md](docs/API.md) | REST API reference |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common issues & solutions |

---

## 🧠 How AI Agents Use MVM

### Automatic Context Loading

When you open a project with `.mvm-project` file, the AI agent:

1. Reads `projectId` from `.mvm-project`
2. Queries MVM database via MCP
3. Loads pending tasks and latest context dump
4. Resumes from `next_step_prompt` if available

### Example Workflow

```
USER: What should I work on next?
AI: [Reads .mvm-project → Queries MVM → Finds context dump]
    "Based on the context dump, you were working on lazy loading 
    pagination. The next step is to implement the frontend UI 
    with intersection observer..."
```

See [MCP_INTEGRATION.md](docs/MCP_INTEGRATION.md) for setup details.

---

## 🔧 Technology Stack

- **Frontend**: Next.js 16 (App Router, Turbopack)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **AI Integration**: Model Context Protocol (MCP)
- **UI**: React, TailwindCSS, dnd-kit

---

## 📖 Core Concepts

### Projects & Versions
- **Project**: Top-level container (e.g., "My App")
- **Version**: Milestones within a project (e.g., "v1.0", "v2.0")
- **Task**: Work items linked to versions

### Context Dumps
AI agents create context dumps at session end:
```json
{
  "mental_model": "Summary of what was accomplished",
  "next_step_prompt": "Specific instruction for next session",
  "workspace_location": "office" | "home"
}
```

### Activities
Auto-generated logs from:
- Task creation/completion
- Version changes
- AI commands

Used for changelog generation.

---

## 🔗 Verify Integration

After setup, test your MCP connection:

```bash
# Ask your AI agent:
"Read .mvm-project and list all pending tasks"

# Expected behavior:
# 1. AI reads projectId from .mvm-project
# 2. Queries: SELECT * FROM tasks WHERE project_id = '...' AND is_done = false
# 3. Returns task list
```

If this works, your integration is successful! 🎉

---

## 🤝 Contributing

Contributions welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙋 Support

- **Issues**: [GitHub Issues](https://github.com/kienpro307/version-control/issues)
- **Documentation**: [docs/](docs/)
- **Troubleshooting**: [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
