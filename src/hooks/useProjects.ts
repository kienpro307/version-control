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
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            setError(error.message);
        } else {
            setProjects(
                data.map((p) => ({
                    id: p.id,
                    name: p.name,
                    createdAt: p.created_at,
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

    const deleteProject = async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('projects').delete().eq('id', id);

        if (error) {
            setError(error.message);
            return false;
        }

        setProjects((prev) => prev.filter((p) => p.id !== id));
        return true;
    };

    return {
        projects,
        loading,
        error,
        createProject,
        updateProject,
        deleteProject,
        refetch: fetchProjects,
    };
}
