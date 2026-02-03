'use client';

import { useCallback, useState } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import type { Task } from '@/lib/types';
import { useActivities } from './useActivities';

interface VersionPagination {
    offset: number;
    hasMore: boolean;
    loading: boolean;
}

async function fetchTasks(projectId: string): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((t) => ({
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
    }));
}

async function fetchTasksByVersion(
    projectId: string,
    versionId: string | null,
    offset: number,
    limit: number = 20
): Promise<Task[]> {
    let query = supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

    if (versionId === null) {
        query = query.is('version_id', null);
    } else {
        query = query.eq('version_id', versionId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((t) => ({
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
    }));
}

export function useTasks(projectId: string | null) {
    const { logActivity } = useActivities(projectId);

    const {
        data: tasks = [],
        mutate,
        isLoading: loading,
    } = useSWR(
        projectId ? ['tasks', projectId] : null,
        ([, projectId]) => fetchTasks(projectId),
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
        }
    );

    // Pagination state per version
    const [versionPagination, setVersionPagination] = useState<Map<string, VersionPagination>>(new Map());

    const createTask = async (
        content: string,
        activeVersionId: string | null
    ): Promise<Task | null> => {
        console.log('🔵 createTask called:', { content, activeVersionId, projectId });

        if (!projectId) return null;

        // Calculate new position (append to bottom)
        const versionTasks = tasks.filter(t => t.versionId === activeVersionId);
        const maxPosition = versionTasks.length > 0 ? Math.max(...versionTasks.map(t => t.position)) : -1;
        const newPosition = maxPosition + 1;

        console.log('🟡 Inserting task:', {
            project_id: projectId,
            version_id: activeVersionId,
            content,
            position: newPosition,
        });

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
            console.error('🔴 Error creating task:', error.message);
            return null;
        }

        console.log('🟢 Task created successfully:', data);

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

        // Optimistic update + revalidate
        mutate([...tasks, newTask], { revalidate: true });

        logActivity('create_task', 'task', newTask.id, `Created task: ${content.substring(0, 30)}...`);

        return newTask;
    };

    const reorderTask = async (taskId: string, newPosition: number, newVersionId?: string | null): Promise<boolean> => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return false;

        const versionId = newVersionId !== undefined ? newVersionId : task.versionId;

        // Optimistic update
        const updatedTasks = tasks.map(t => {
            if (t.id === taskId) {
                return { ...t, position: newPosition, versionId: versionId };
            }
            return t;
        });
        mutate(updatedTasks, { revalidate: false });

        const updateData: Record<string, unknown> = { position: newPosition };
        if (newVersionId !== undefined) {
            updateData.version_id = newVersionId;
        }

        const { error } = await supabase
            .from('tasks')
            .update(updateData)
            .eq('id', taskId);

        if (error) {
            console.error('Error reordering task:', error.message);
            mutate(); // Revert on error
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

        // Optimistic update
        const updatedTasks = tasks.map((t) =>
            t.id === id ? { ...t, isDone: newIsDone, doneAt } : t
        );
        mutate(updatedTasks, { revalidate: false });

        const { error } = await supabase
            .from('tasks')
            .update({ is_done: newIsDone, done_at: doneAt })
            .eq('id', id);

        if (error) {
            console.error('Error toggling task:', error.message);
            mutate(); // Revert
            return false;
        }

        logActivity(
            newIsDone ? 'complete_task' : 'reopen_task',
            'task',
            id,
            `${newIsDone ? 'Completed' : 'Reopened'} task: ${task.content.substring(0, 30)}...`
        );

        return true;
    };

    const updateTask = async (id: string, content: string): Promise<boolean> => {
        // Optimistic update
        const updatedTasks = tasks.map((t) => (t.id === id ? { ...t, content } : t));
        mutate(updatedTasks, { revalidate: false });

        const { error } = await supabase
            .from('tasks')
            .update({ content })
            .eq('id', id);

        if (error) {
            console.error('Error updating task:', error.message);
            mutate();
            return false;
        }

        return true;
    };

    const updateTaskDetails = async (id: string, updates: Partial<Task>): Promise<boolean> => {
        const dbUpdates: Record<string, unknown> = {};
        if (updates.content !== undefined) dbUpdates.content = updates.content;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.labels !== undefined) dbUpdates.labels = updates.labels;
        if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
        if (updates.isDone !== undefined) {
            dbUpdates.is_done = updates.isDone;
            dbUpdates.done_at = updates.isDone ? new Date().toISOString() : null;
        }

        // Optimistic update
        const updatedTasks = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
        mutate(updatedTasks, { revalidate: false });

        const { error } = await supabase
            .from('tasks')
            .update(dbUpdates)
            .eq('id', id);

        if (error) {
            console.error('Error updating task details:', error.message);
            mutate();
            return false;
        }

        return true;
    };

    const deleteTask = async (id: string): Promise<boolean> => {
        // Optimistic update
        const updatedTasks = tasks.filter((t) => t.id !== id);
        mutate(updatedTasks, { revalidate: false });

        const { error } = await supabase.from('tasks').delete().eq('id', id);

        if (error) {
            console.error('Error deleting task:', error.message);
            mutate();
            return false;
        }

        logActivity('delete_task', 'task', id, 'Deleted task');
        return true;
    };

    const getPendingTasks = useCallback((): Task[] => {
        return tasks.filter((t) => !t.isDone);
    }, [tasks]);

    const getCompletedTasks = useCallback((): Task[] => {
        return tasks.filter((t) => t.isDone);
    }, [tasks]);

    const getTasksByVersion = useCallback((versionId: string): Task[] => {
        return tasks.filter((t) => t.versionId === versionId);
    }, [tasks]);

    const moveTask = useCallback((taskId: string, newPosition: number, newVersionId?: string | null) => {
        const updatedTasks = tasks.map(t => {
            if (t.id === taskId) {
                return { ...t, versionId: newVersionId !== undefined ? newVersionId : t.versionId };
            }
            return t;
        });
        mutate(updatedTasks, { revalidate: false });
    }, [tasks, mutate]);

    // Expose setTasks-like functionality through mutate for dnd-kit compatibility
    const setTasks = useCallback((updater: Task[] | ((prev: Task[]) => Task[])) => {
        if (typeof updater === 'function') {
            mutate(updater(tasks), { revalidate: false });
        } else {
            mutate(updater, { revalidate: false });
        }
    }, [tasks, mutate]);

    const loadMoreTasks = useCallback(async (versionId: string | null): Promise<boolean> => {
        if (!projectId) return false;

        const versionKey = versionId || 'unassigned';
        const currentPagination = versionPagination.get(versionKey) || { offset: 0, hasMore: true, loading: false };

        if (currentPagination.loading || !currentPagination.hasMore) {
            return false;
        }

        // Set loading state
        setVersionPagination(prev => {
            const next = new Map(prev);
            next.set(versionKey, { ...currentPagination, loading: true });
            return next;
        });

        try {
            const newTasks = await fetchTasksByVersion(projectId, versionId, currentPagination.offset, 20);

            if (newTasks.length < 20) {
                // No more tasks available
                setVersionPagination(prev => {
                    const next = new Map(prev);
                    next.set(versionKey, {
                        offset: currentPagination.offset + newTasks.length,
                        hasMore: false,
                        loading: false
                    });
                    return next;
                });
            } else {
                // More tasks might be available
                setVersionPagination(prev => {
                    const next = new Map(prev);
                    next.set(versionKey, {
                        offset: currentPagination.offset + newTasks.length,
                        hasMore: true,
                        loading: false
                    });
                    return next;
                });
            }

            // Merge new tasks with existing ones
            mutate([...tasks, ...newTasks], { revalidate: false });
            return true;
        } catch (error) {
            console.error('Error loading more tasks:', error);
            setVersionPagination(prev => {
                const next = new Map(prev);
                next.set(versionKey, { ...currentPagination, loading: false });
                return next;
            });
            return false;
        }
    }, [projectId, tasks, mutate, versionPagination]);

    const getVersionPaginationState = useCallback((versionId: string | null) => {
        const versionKey = versionId || 'unassigned';
        return versionPagination.get(versionKey) || { offset: 0, hasMore: true, loading: false };
    }, [versionPagination]);

    return {
        tasks,
        setTasks,
        loading,
        createTask,
        reorderTask,
        moveTask,
        toggleDone,
        updateTask,
        updateTaskDetails,
        deleteTask,
        getPendingTasks,
        getCompletedTasks,
        getTasksByVersion,
        loadMoreTasks,
        getVersionPaginationState,
        refetch: mutate,
    };
}
