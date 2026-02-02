# My Version Manager

A personal project tracking system with REST API for AI Agent integration.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run database migrations
# Copy contents of supabase/schema.sql and supabase/migration_groups.sql
# to Supabase SQL Editor and execute

# Start development server
npm run dev
```

## Features

- **Project Management**: Organize projects into hierarchical groups
- **Version Tracking**: Track releases and milestones
- **Task Management**: Create, update, and track work items
- **REST API**: Full CRUD API for AI Agent integration
- **Real-time Sync**: Powered by Supabase

## Documentation

| Document | Description |
|----------|-------------|
| [API Reference](./API.md) | Complete API documentation for AI Agents |
| [Setup Guide](./SETUP.md) | Deployment and configuration instructions |
| [Roadmap](./ROADMAP.md) | Future features and TODOs |

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS

## API Overview

Base URL: `https://your-app.vercel.app/api`

| Endpoint | Description |
|----------|-------------|
| `GET /api/projects` | List all projects |
| `POST /api/projects/:id/tasks` | Create a task |
| `PATCH /api/tasks/:id` | Update a task |
| `GET /api/search?q=keyword` | Search across all entities |
| `POST /api/tasks/bulk` | Bulk operations |

See [API.md](./API.md) for full documentation.

## License

MIT
