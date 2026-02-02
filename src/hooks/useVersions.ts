'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Version } from '@/lib/types';
import { useActivities } from './useActivities';

export function useVersions(projectId: string | null) {
    const [versions, setVersions] = useState<Version[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { logActivity } = useActivities(projectId);

    const fetchVersions = useCallback(async () => {
        if (!projectId) {
            setVersions([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const { data, error } = await supabase
            .from('versions')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) {
            setError(error.message);
        } else {
            setVersions(
                data.map((v) => ({
                    id: v.id,
                    projectId: v.project_id,
                    name: v.name,
                    isActive: v.is_active,
                    createdAt: v.created_at,
                }))
            );
        }
        setLoading(false);
    }, [projectId]);

    useEffect(() => {
        fetchVersions();
    }, [fetchVersions]);

    const createVersion = async (
        name: string,
        migratePendingTasks: boolean = true
    ): Promise<Version | null> => {
        if (!projectId) return null;

        // Deactivate all other versions first
        await supabase
            .from('versions')
            .update({ is_active: false })
            .eq('project_id', projectId);

        // Create new active version
        const { data, error } = await supabase
            .from('versions')
            .insert({ project_id: projectId, name, is_active: true })
            .select()
            .single();

        if (error) {
            setError(error.message);
            return null;
        }

        // Migrate pending tasks to new version
        if (migratePendingTasks) {
            await supabase
                .from('tasks')
                .update({ version_id: data.id })
                .eq('project_id', projectId)
                .eq('is_done', false);
        }

        const newVersion: Version = {
            id: data.id,
            projectId: data.project_id,
            name: data.name,
            isActive: data.is_active,
            createdAt: data.created_at,
        };

        setVersions((prev) => [
            newVersion,
            ...prev.map((v) => ({ ...v, isActive: false })),
        ]);

        logActivity('create_version', 'version', data.id, `Created version: ${name}`);

        return newVersion;
    };

    const setActiveVersion = async (id: string): Promise<boolean> => {
        if (!projectId) return false;

        // Deactivate all versions
        await supabase
            .from('versions')
            .update({ is_active: false })
            .eq('project_id', projectId);

        // Activate selected version
        const { error } = await supabase
            .from('versions')
            .update({ is_active: true })
            .eq('id', id);

        if (error) {
            setError(error.message);
            return false;
        }

        setVersions((prev) =>
            prev.map((v) => ({ ...v, isActive: v.id === id }))
        );
        return true;
    };

    const deleteVersion = async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('versions').delete().eq('id', id);

        if (error) {
            setError(error.message);
            return false;
        }

        setVersions((prev) => prev.filter((v) => v.id !== id));
        logActivity('delete_version', 'version', id, 'Deleted version');
        return true;
    };

    const updateVersion = async (id: string, updates: Partial<Version>): Promise<boolean> => {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

        const { error } = await supabase
            .from('versions')
            .update(dbUpdates)
            .eq('id', id);

        if (error) {
            setError(error.message);
            return false;
        }

        setVersions(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));

        if (updates.isActive === false) {
            logActivity('release_version', 'version', id, `Released version`);
        } else if (updates.name) {
            logActivity('update_version', 'version', id, `Updated version name to ${updates.name}`);
        }

        return true;
    };

    const getActiveVersion = (): Version | undefined => {
        return versions.find((v) => v.isActive);
    };

    return {
        versions,
        loading,
        error,
        createVersion,
        setActiveVersion,
        updateVersion,
        deleteVersion,
        getActiveVersion,
        refetch: fetchVersions,
    };
}
