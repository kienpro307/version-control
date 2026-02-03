'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/lib/types';
import { useActivities } from './useActivities';

export function useProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { logActivity } = useActivities(null);

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (projectsError) {
            setError(projectsError.message);
        } else {
            // Fetch incomplete tasks count for each project
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('project_id')
                .eq('is_done', false);

            const taskCounts: Record<string, number> = {};
            if (tasksData) {
                tasksData.forEach((t: { project_id: string }) => {
                    taskCounts[t.project_id] = (taskCounts[t.project_id] || 0) + 1;
                });
            }

            setProjects(
                projectsData.map((p) => ({
                    id: p.id,
                    name: p.name,
                    createdAt: p.created_at,
                    progress: p.progress || 0,
                    incompleteTaskCount: taskCounts[p.id] || 0,
                    localPath: p.local_path || undefined,
                }))
            );
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const createProject = async (name: string): Promise<Project | null> => {
        const { data, error } = await supabase
            .from('projects')
            .insert({ name })
            .select()
            .single();

        if (error) {
            setError(error.message);
            return null;
        }

        const newProject: Project = {
            id: data.id,
            name: data.name,
            createdAt: data.created_at,
            progress: 0,
        };
        setProjects((prev) => [newProject, ...prev]);

        logActivity('create_project', 'project', newProject.id, `Created project: ${name}`, {}, newProject.id);

        return newProject;
    };

    const updateProject = async (id: string, name: string): Promise<boolean> => {
        const { error } = await supabase
            .from('projects')
            .update({ name })
            .eq('id', id);

        if (error) {
            setError(error.message);
            return false;
        }

        setProjects((prev) =>
            prev.map((p) => (p.id === id ? { ...p, name } : p))
        );
        return true;
    };

    const updateProjectProgress = async (id: string, progress: number): Promise<boolean> => {
        const { error } = await supabase
            .from('projects')
            .update({ progress })
            .eq('id', id);

        if (error) {
            setError(error.message);
            return false;
        }

        setProjects((prev) =>
            prev.map((p) => (p.id === id ? { ...p, progress } : p))
        );
        return true;
    };

    const updateProjectLocalPath = async (id: string, localPath: string): Promise<boolean> => {
        const { error } = await supabase
            .from('projects')
            .update({ local_path: localPath })
            .eq('id', id);

        if (error) {
            setError(error.message);
            return false;
        }

        setProjects((prev) =>
            prev.map((p) => (p.id === id ? { ...p, localPath } : p))
        );
        return true;
    };

    const deleteProject = async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('projects').delete().eq('id', id);

        if (error) {
            setError(error.message);
            return false;
        }

        setProjects((prev) => prev.filter((p) => p.id !== id));
        return true;
    };

    const renameFolder = async (oldPath: string, newPath: string): Promise<boolean> => {
        // Find all projects that start with oldPath/
        const affectedProjects = projects.filter(
            (p) => p.name === oldPath || p.name.startsWith(oldPath + '/')
        );

        if (affectedProjects.length === 0) return true;

        // Batch update each project
        for (const project of affectedProjects) {
            let newName: string;
            if (project.name === oldPath) {
                newName = newPath;
            } else {
                newName = newPath + project.name.slice(oldPath.length);
            }

            const { error } = await supabase
                .from('projects')
                .update({ name: newName })
                .eq('id', project.id);

            if (error) {
                setError(error.message);
                return false;
            }
        }

        // Update local state
        setProjects((prev) =>
            prev.map((p) => {
                if (p.name === oldPath) {
                    return { ...p, name: newPath };
                } else if (p.name.startsWith(oldPath + '/')) {
                    return { ...p, name: newPath + p.name.slice(oldPath.length) };
                }
                return p;
            })
        );

        return true;
    };

    return {
        projects,
        loading,
        error,
        createProject,
        updateProject,
        updateProjectProgress,
        updateProjectLocalPath,
        deleteProject,
        renameFolder,
        refetch: fetchProjects,
    };
}
