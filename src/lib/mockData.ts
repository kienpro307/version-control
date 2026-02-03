import { Project, Version, Task } from './types';

export const mockProjects: Project[] = [
  { id: 'p1', name: 'All Translate App', createdAt: '2024-01-15T10:00:00Z', progress: 75 },
  { id: 'p2', name: 'Portfolio Website', createdAt: '2024-02-01T08:00:00Z', progress: 50 },
  { id: 'p3', name: 'E-commerce Admin', createdAt: '2024-02-10T14:00:00Z', progress: 20 },
];

export const mockVersions: Version[] = [
  { id: 'v1', projectId: 'p1', name: 'v1.0.0', isActive: false, createdAt: '2024-01-15T10:00:00Z' },
  { id: 'v2', projectId: 'p1', name: 'v1.0.1', isActive: false, createdAt: '2024-01-20T10:00:00Z' },
  { id: 'v3', projectId: 'p1', name: 'v1.0.2', isActive: true, createdAt: '2024-02-01T10:00:00Z' },
  { id: 'v4', projectId: 'p2', name: 'v1.0.0', isActive: true, createdAt: '2024-02-01T08:00:00Z' },
  { id: 'v5', projectId: 'p3', name: 'v0.1.0', isActive: true, createdAt: '2024-02-10T14:00:00Z' },
];

export const mockTasks: Task[] = [
  { id: 't1', projectId: 'p1', versionId: 'v1', content: 'Setup project structure', isDone: true, createdAt: '2024-01-15T10:00:00Z', doneAt: '2024-01-16T15:30:00Z', position: 0 },
  { id: 't2', projectId: 'p1', versionId: 'v1', content: 'Implement translation API', isDone: true, createdAt: '2024-01-15T11:00:00Z', doneAt: '2024-01-18T12:00:00Z', position: 1 },
  { id: 't3', projectId: 'p1', versionId: 'v2', content: 'Fix AdMob display bug', isDone: true, createdAt: '2024-01-20T09:00:00Z', doneAt: '2024-01-20T14:00:00Z', position: 0 },
  { id: 't4', projectId: 'p1', versionId: 'v2', content: 'Add dark mode support', isDone: true, createdAt: '2024-01-20T10:00:00Z', doneAt: '2024-01-21T16:00:00Z', position: 1 },
  { id: 't5', projectId: 'p1', versionId: 'v3', content: 'Optimize startup performance', isDone: true, createdAt: '2024-02-01T08:00:00Z', doneAt: '2024-02-02T10:00:00Z', position: 0 },
  { id: 't6', projectId: 'p1', versionId: 'v3', content: 'Implement push notifications', isDone: false, createdAt: '2024-02-01T09:00:00Z', doneAt: null, position: 1 },
  { id: 't7', projectId: 'p1', versionId: 'v3', content: 'Add offline mode', isDone: false, createdAt: '2024-02-01T10:00:00Z', doneAt: null, position: 2 },
  { id: 't8', projectId: 'p2', versionId: 'v4', content: 'Design landing page', isDone: true, createdAt: '2024-02-01T08:00:00Z', doneAt: '2024-02-02T12:00:00Z', position: 0 },
  { id: 't9', projectId: 'p2', versionId: 'v4', content: 'Add contact form', isDone: false, createdAt: '2024-02-02T09:00:00Z', doneAt: null, position: 1 },
  { id: 't10', projectId: 'p3', versionId: 'v5', content: 'Setup admin dashboard', isDone: false, createdAt: '2024-02-10T14:00:00Z', doneAt: null, position: 0 },
];

export const mockSettings = {
  lastProjectId: 'p1',
};
