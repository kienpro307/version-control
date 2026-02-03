# MVM CLI

CLI tool to set up MVM (My Version Manager) integration in any project.

## Installation

```bash
npm install -g @kien307/mvm-cli
```

## Usage

```bash
# With npx (no install needed)
npx @kien307/mvm-cli <project-path> <project-uuid>

# After global install
mvm-setup <project-path> <project-uuid>
```

## Example

```bash
npx @kien307/mvm-cli D:\Projects\MyApp abc-123-def-456
```

## What it does

1. Creates `.mvm-project` with your project UUID
2. Creates `.agent/workflows/mvm.md` with all MVM commands

## Get Project UUID

1. Go to MVM UI: https://mvm.vercel.app
2. Create or select a project
3. Copy the project ID

## Machine Setup

For first-time machine setup, see [MACHINE_SETUP.md](../../docs/MACHINE_SETUP.md) to configure:
- `~/.gemini/GEMINI.md` global config
- MCP server connection
