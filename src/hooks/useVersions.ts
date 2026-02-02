'use client';

import { useCallback } from 'react';
import useSWRInfinite from 'swr/infinite';
import { supabase } from '@/lib/supabase';
import type { Version } from '@/lib/types';
import { useActivities } from './useActivities';

const VERSIONS_PER_PAGE = 10;

interface VersionsPage {
    versions: Version[];
    hasMore: boolean;
}

async function fetchVersionsPage(projectId: string, page: number): Promise<VersionsPage> {
    const from = page * VERSIONS_PER_PAGE;
    const to = from + VERSIONS_PER_PAGE - 1;

    const { data, error, count } = await supabase
        .from('versions')
        .select('*', { count: 'exact' })
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) throw error;

    const versions = (data || []).map((v) => ({
        id: v.id,
        projectId: v.project_id,
        name: v.name,
        isActive: v.is_active,
        changelog: v.changelog,
        createdAt: v.created_at,
    }));

    const totalLoaded = from + versions.length;
    const hasMore = count ? totalLoaded < count : false;

    return { versions, hasMore };
}

export function useVersions(projectId: string | null) {
    const { logActivity } = useActivities(projectId);

    const getKey = useCallback((pageIndex: number, previousPageData: VersionsPage | null) => {
        if (!projectId) return null;
        if (previousPageData && !previousPageData.hasMore) return null;
        return ['versions', projectId, pageIndex];
    }, [projectId]);

    const fetcher = useCallback(async ([, projectId, pageIndex]: [string, string, number]) => {
        return fetchVersionsPage(projectId, pageIndex);
    }, []);

    const {
        data: pages,
        size,
        setSize,
        mutate,
        isLoading,
        isValidating,
    } = useSWRInfinite<VersionsPage>(getKey, fetcher, {
        revalidateOnFocus: false,
        revalidateFirstPage: false,
        dedupingInterval: 60000,
        persistSize: true,
    });

    // Flatten pages into single array
    const versions = pages?.flatMap(page => page.versions) || [];
    const hasMore = pages && pages.length > 0 ? pages[pages.length - 1].hasMore : false;
    const loading = isLoading;

    const loadMore = useCallback(() => {
        if (!isValidating && hasMore) {
            setSize(size + 1);
        }
    }, [setSize, size, isValidating, hasMore]);

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
            console.error('Error creating version:', error.message);
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

        // Revalidate cache to include new version
        mutate();

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
            console.error('Error setting active version:', error.message);
            return false;
        }

        // Revalidate to reflect changes
        mutate();
        return true;
    };

    const deleteVersion = async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('versions').delete().eq('id', id);

        if (error) {
            console.error('Error deleting version:', error.message);
            return false;
        }

        mutate();
        logActivity('delete_version', 'version', id, 'Deleted version');
        return true;
    };

    const updateVersion = async (id: string, updates: Partial<Version>): Promise<boolean> => {
        const dbUpdates: Record<string, unknown> = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
        if (updates.changelog !== undefined) dbUpdates.changelog = updates.changelog;

        const { error } = await supabase
            .from('versions')
            .update(dbUpdates)
            .eq('id', id);

        if (error) {
            console.error('Error updating version:', error.message);
            return false;
        }

        mutate();

        if (updates.isActive === false) {
            logActivity('release_version', 'version', id, `Released version`);
        } else if (updates.changelog) {
            logActivity('save_changelog', 'version', id, `Saved changelog for version`);
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
        isValidating,
        hasMore,
        loadMore,
        createVersion,
        setActiveVersion,
        updateVersion,
        deleteVersion,
        getActiveVersion,
        refetch: mutate,
    };
}
