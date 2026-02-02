'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Task } from '@/lib/types';
import { useActivities } from './useActivities';

export function useTasks(projectId: string | null) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { logActivity } = useActivities(projectId);

    const fetchTasks = useCallback(async () => {
        if (!projectId) {
            setTasks([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', projectId)
            .order('position', { ascending: true }); // Sort by position

        if (error) {
            setError(error.message);
        } else {
            setTasks(
                data.map((t) => ({
                    id: t.id,
                    projectId: t.project_id,
                    versionId: t.version_id,
                    content: t.content,
                    isDone: t.is_done,
                    createdAt: t.created_at,
                    doneAt: t.done_at,
                    position: t.position || 0,
                    description: t.description || '',
                    labels: t.labels || [],
                    priority: t.priority || 'none',
                }))
            );
        }
        setLoading(false);
    }, [projectId]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const createTask = async (
        content: string,
        activeVersionId: string | null
    ): Promise<Task | null> => {
        if (!projectId) return null;

        // Calculate new position (append to bottom)
        const versionTasks = tasks.filter(t => t.versionId === activeVersionId);
        const maxPosition = versionTasks.length > 0 ? Math.max(...versionTasks.map(t => t.position)) : -1;
        const newPosition = maxPosition + 1;

        const { data, error } = await supabase
            .from('tasks')
            .insert({
                project_id: projectId,
                version_id: activeVersionId,
                content,
                is_done: false,
                position: newPosition,
            })
            .select()
            .single();

        if (error) {
            setError(error.message);
            return null;
        }

        const newTask: Task = {
            id: data.id,
            projectId: data.project_id,
            versionId: data.version_id,
            content: data.content,
            isDone: data.is_done,
            createdAt: data.created_at,
            doneAt: data.done_at,
            position: data.position,
        };

        setTasks((prev) => [...prev, newTask]);

        logActivity('create_task', 'task', newTask.id, `Created task: ${content.substring(0, 30)}...`);

        return newTask;
    };

    const reorderTask = async (taskId: string, newPosition: number, newVersionId?: string | null): Promise<boolean> => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return false;

        const versionId = newVersionId !== undefined ? newVersionId : task.versionId;

        // Optimistic update
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                return { ...t, position: newPosition, versionId: versionId };
            }
            return t;
        }));

        const updateData: any = { position: newPosition };
        if (newVersionId !== undefined) {
            updateData.version_id = newVersionId;
        }

        const { error } = await supabase
            .from('tasks')
            .update(updateData)
            .eq('id', taskId);

        if (error) {
            setError(error.message);
            // Revert optimistic update ideally, but skipping for simplicity in V1
            return false;
        }
        return true;
    };

    const toggleDone = async (id: string, forcedValue?: boolean): Promise<boolean> => {
        const task = tasks.find((t) => t.id === id);
        if (!task) return false;

        const newIsDone = forcedValue !== undefined ? forcedValue : !task.isDone;
        if (newIsDone === task.isDone) return true;

        const doneAt = newIsDone ? new Date().toISOString() : null;

        const { error } = await supabase
            .from('tasks')
            .update({ is_done: newIsDone, done_at: doneAt })
            .eq('id', id);

        if (error) {
            setError(error.message);
            return false;
        }

        setTasks((prev) =>
            prev.map((t) =>
                t.id === id ? { ...t, isDone: newIsDone, doneAt } : t
            )
        );

        logActivity(
            newIsDone ? 'complete_task' : 'reopen_task',
            'task',
            id,
            `${newIsDone ? 'Completed' : 'Reopened'} task: ${task.content.substring(0, 30)}...`
        );

        return true;
    };

    const updateTask = async (id: string, content: string): Promise<boolean> => {
        const { error } = await supabase
            .from('tasks')
            .update({ content })
            .eq('id', id);

        if (error) {
            setError(error.message);
            return false;
        }

        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, content } : t))
        );
        return true;
    };

    const updateTaskDetails = async (id: string, updates: Partial<Task>): Promise<boolean> => {
        const dbUpdates: any = {};
        if (updates.content !== undefined) dbUpdates.content = updates.content;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.labels !== undefined) dbUpdates.labels = updates.labels; // Supabase handles array
        if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
        if (updates.isDone !== undefined) {
            dbUpdates.is_done = updates.isDone;
            dbUpdates.done_at = updates.isDone ? new Date().toISOString() : null;
        }

        const { error } = await supabase
            .from('tasks')
            .update(dbUpdates)
            .eq('id', id);

        if (error) {
            setError(error.message);
            return false;
        }

        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        return true;
    };

    const deleteTask = async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('tasks').delete().eq('id', id);

        if (error) {
            setError(error.message);
            return false;
        }

        setTasks((prev) => prev.filter((t) => t.id !== id));
        logActivity('delete_task', 'task', id, 'Deleted task');
        return true;
    };

    const getPendingTasks = (): Task[] => {
        return tasks.filter((t) => !t.isDone);
    };

    const getCompletedTasks = (): Task[] => {
        return tasks.filter((t) => t.isDone);
    };

    const getTasksByVersion = (versionId: string): Task[] => {
        return tasks.filter((t) => t.versionId === versionId);
    };

    const moveTask = (taskId: string, newPosition: number, newVersionId?: string | null) => {
        setTasks(prev => {
            const activeTask = prev.find(t => t.id === taskId);
            if (!activeTask) return prev;

            const versionId = newVersionId !== undefined ? newVersionId : activeTask.versionId;

            // Just update the moved task fields, consumer handles array reordering logic?
            // No, dnd-kit assumes we reorder the array.
            // But 'position' is a field. 
            // Logic:
            // 1. Remove task from old list
            // 2. Insert into new list at position
            // 3. Recalculate positions for affected items?

            // Simpler approach for local state:
            // Map task to new version/position.
            // We rely on 'position' field for sorting? 
            // Yes, fetchTasks sorts by position.
            // But if we just change one task's position, we might have collision.
            // We generally need to update positions of OTHER tasks too.

            // PROPER IMPLEMENTATION:
            // We won't do full reorder calculation here for local Dnd visual. 
            // Dnd-kit's SortableContext uses the order of the ID array passed to it.
            // So if we just update the `tasks` array order, that's enough for visuals if utilizing array index?
            // But our `VersionSection` sorts by `position` explicitly or `createdAt`.
            // My `fetchTasks` sorts by `position`.
            // `VersionSection` sorts: `const sortedTasks = [...tasks];` (I removed the sort logic in rewrite).
            // So `VersionSection` relies on the order of `tasks` passed to it.
            // `tasks` comes from `useTasks` -> filtered by version.

            return prev.map(t => {
                if (t.id === taskId) {
                    return { ...t, versionId: newVersionId !== undefined ? newVersionId : t.versionId };
                }
                return t;
            });
        });
    };

    return {
        tasks,
        setTasks, // Expose for dnd-kit arrayMove
        loading,
        error,
        createTask,
        reorderTask,
        moveTask,
        // ...
        toggleDone,
        updateTask,
        updateTaskDetails,
        deleteTask,
        getPendingTasks,
        getCompletedTasks,
        getTasksByVersion,
        refetch: fetchTasks,
    };
}
