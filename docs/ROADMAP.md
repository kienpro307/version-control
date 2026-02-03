# Roadmap & Future Features

## Current Status

| Feature | Status |
|---------|--------|
| Core CRUD (Projects, Versions, Tasks) | ✅ Done |
| Supabase Integration | ✅ Done |
| REST API | ✅ Done |
| API Authentication | ✅ Done |
| API Documentation (Web) | ✅ Done |
| Search API | ✅ Done |
| Bulk Operations | ✅ Done |
| Project Groups | ✅ API Done, UI Pending |
| Vercel Deployment | 🔄 Ready to deploy |

---

## Planned Features

### High Priority

#### Groups UI
- [ ] Sidebar with group tree navigation
- [ ] Drag-and-drop projects between groups
- [ ] Filter dashboard by group

#### Enhanced Search
- [ ] Full-text search with PostgreSQL `tsvector`
- [ ] Search history
- [ ] Saved searches

#### Webhooks
- [ ] Notify on task completion (Slack, Discord, custom URL)
- [ ] Configurable triggers

### Medium Priority

#### Analytics Dashboard
- [ ] Tasks completed per day/week
- [ ] Version velocity metrics
- [ ] Project activity heatmap

#### Import/Export
- [ ] CSV export
- [ ] JSON export (already partial)
- [ ] Bulk import from CSV

#### Collaboration (if multi-user needed)
- [ ] User authentication (Supabase Auth)
- [ ] Per-user API keys
- [ ] Audit log

### Low Priority / Nice-to-have

#### Mobile PWA
- [ ] Offline support with service worker
- [ ] Push notifications

#### AI Features
- [ ] Auto-categorize tasks
- [ ] Suggested next tasks based on history
- [x] Natural language task creation

---

## Known Issues

| Issue | Priority | Notes |
|-------|----------|-------|
| Groups not shown in UI | Medium | API works, UI needs update |
| No rate limiting | Low | Add if public |
| Middleware deprecation warning | Low | Next.js 16 proxy migration |

---

## Contributing

This is a personal project, but suggestions are welcome via GitHub Issues.

---

## Changelog

### 2024-02-02
- Initial release
- Core CRUD operations
- REST API with Bearer auth
- Supabase backend
- Search API
- Bulk Operations API
- AI-first documentation
