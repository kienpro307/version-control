import { Project, Version, Task, Activity } from '@/lib/types';

export const generateAgentPrompts = {
    summarizeProject: (project: Project, versions: Version[], tasks: Task[], activities: Activity[]) => {
        const activeVersion = versions.find(v => v.isActive);
        const pendingTasks = tasks.filter(t => !t.isDone);
        const recentActivity = activities.slice(0, 5).map(a => `- ${a.action_type} on ${a.entity_type}: ${a.description || ''}`).join('\n');

        return `# Project Summary: ${project.name}

## Current Status
- Active Version: ${activeVersion?.name || 'None'}
- Pending Tasks: ${pendingTasks.length}

## Recent Context
${recentActivity}

## Top Priorities
${pendingTasks.slice(0, 5).map(t => `- [ ] ${t.content}`).join('\n')}

---
Please analyze this project state and suggest the most critical next step.`;
    },

    nextTaskSuggestion: (tasks: Task[], mentalModel: string | null) => {
        const highPriority = tasks.filter(t => t.priority === 'urgent' || t.priority === 'high');

        return `# Task Analysis Request

## Context
${mentalModel ? `Current Mental Model:\n${mentalModel}\n` : ''}

## High Priority Tasks
${highPriority.length > 0 ? highPriority.map(t => `- ${t.content} (${t.priority})`).join('\n') : 'No high priority tasks flagged.'}

## All Pending Tasks
${tasks.filter(t => !t.isDone).map(t => `- ${t.content}`).join('\n')}

---
Based on the above, which task should I tackle next to maximize impact/velocity? Explain why.`;
    },

    changelogDraft: (version: Version, completedTasks: Task[]) => {
        return `# Changelog Generation Request

Version: ${version.name}
Date: ${new Date().toLocaleDateString()}

## Completed Items
${completedTasks.map(t => `- ${t.content}`).join('\n')}

---
Write a professional, engaging changelog for this release. Group by feature/fix if possible. Use emojis sparingly.`;
    }
};
