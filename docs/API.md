# API Reference

> **For AI Agents**: This document is your complete reference for interacting with My Version Manager.

## Authentication

All API requests require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <API_SECRET_KEY>
```

## Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:3000/api` |
| Production | `https://your-app.vercel.app/api` |

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": { "total": 10 }  // optional, for lists
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Task with id 'xyz' not found"
  }
}
```

---

## Endpoints

### 1. Project Groups

Hierarchical organization for projects.

#### List Groups (Tree)
```
GET /api/groups
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Mobile Apps",
      "parent_id": null,
      "children": [
        { "id": "uuid", "name": "Android", "children": [] }
      ]
    }
  ]
}
```

#### Create Group
```
POST /api/groups
Content-Type: application/json

{
  "name": "Web Projects",
  "parentId": "optional-parent-uuid"
}
```

---

### 2. Projects

#### List Projects
```
GET /api/projects
GET /api/projects?groupId=uuid  // filter by group
```

#### Create Project
```
POST /api/projects
Content-Type: application/json

{
  "name": "My App",
  "groupId": "optional-group-uuid"
}
```

#### Get Project
```
GET /api/projects/:id
```

---

### 3. Versions

#### List Versions
```
GET /api/projects/:id/versions
```

**Response includes `isActive: true` for current version.**

#### Create Version
```
POST /api/projects/:id/versions
Content-Type: application/json

{
  "name": "v1.0.0",
  "migratePendingTasks": true  // move pending tasks to new version
}
```

> **Note**: Creating a new version automatically deactivates the previous active version.

---

### 4. Tasks

#### List Tasks
```
GET /api/projects/:id/tasks
GET /api/projects/:id/tasks?status=pending
GET /api/projects/:id/tasks?status=done
GET /api/projects/:id/tasks?versionId=uuid
```

#### Create Task
```
POST /api/projects/:id/tasks
Content-Type: application/json

{
  "content": "Implement login feature",
  "versionId": "optional-version-uuid"  // auto-links to active version if omitted
}
```

#### Update Task
```
PATCH /api/tasks/:id
Content-Type: application/json

{
  "content": "Updated description",  // optional
  "isDone": true                      // optional
}
```

#### Delete Task
```
DELETE /api/tasks/:id
```

---

### 5. Search API

Search across tasks, projects, and versions.

```
GET /api/search?q=keyword
GET /api/search?q=keyword&type=tasks
GET /api/search?q=keyword&projectId=uuid
```

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search query (required) |
| `type` | string | `tasks`, `projects`, `versions`, `all` (default: `all`) |
| `projectId` | uuid | Scope search to specific project |

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [...],
    "projects": [...],
    "versions": [...]
  }
}
```

---

### 6. Bulk Operations

Perform multiple task operations in a single request.

```
POST /api/tasks/bulk
Content-Type: application/json

{
  "operations": [
    { "action": "create", "projectId": "uuid", "content": "Task 1" },
    { "action": "create", "projectId": "uuid", "content": "Task 2" },
    { "action": "update", "id": "task-uuid", "isDone": true },
    { "action": "delete", "id": "task-uuid" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "created": 2,
    "updated": 1,
    "deleted": 1,
    "failed": 0,
    "results": [
      { "action": "create", "success": true, "id": "new-uuid" },
      { "action": "update", "success": true, "id": "task-uuid" },
      ...
    ]
  }
}
```

---

## AI Agent Workflow

### Starting a Session
1. `GET /api/projects` - Find the project ID
2. `GET /api/projects/:id/versions` - Check active version
3. `GET /api/projects/:id/tasks?status=pending` - See pending work

### After Completing Work
1. `POST /api/projects/:id/tasks` - Log what you did
2. `PATCH /api/tasks/:id` - Mark as done immediately

### Releasing a Version
1. `POST /api/projects/:id/versions` with `migratePendingTasks: true`

---

## Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Invalid or missing API key |
| 400 | `BAD_REQUEST` | Missing required fields |
| 404 | `NOT_FOUND` | Resource not found |
| 500 | `SERVER_ERROR` | Internal server error |

---

## System Prompt for AI Agents

```
Tool: MyVersionManager
BaseURL: https://your-app.vercel.app/api
Auth: Bearer Token (from ENV: MVM_API_KEY)

Capabilities:
- Manage Projects, Versions, and Tasks
- "Active Version" = current sprint/release
- Auto-link tasks to active version

Workflow:
1. Session start: Check active version + pending tasks
2. Coding: Implement features/fixes
3. Task done: Log via POST + PATCH isDone=true
4. Release: Create new version with migratePendingTasks=true
```
