import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Activity {
    id: string;
    project_id: string;
    user_id: string;
    action_type: string;
    entity_type: string;
    entity_id: string;
    description?: string;
    diff_summary?: string;
    metadata: any;
    created_at: string;
}


export function useActivities(projectId: string | null) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchActivities = useCallback(async () => {
        if (!projectId) {
            setActivities([]);
            return;
        }

        setLoading(true);
        const { data, error } = await supabase
            .from('activities')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(50); // increased limit

        if (!error && data) {
            setActivities(data);
        }
        setLoading(false);
    }, [projectId]);

    const logActivity = async (
        action_type: string,
        entity_type: string,
        entity_id: string,
        description?: string,
        metadata: any = {},
        overrideProjectId?: string,
        diff_summary?: string
    ) => {
        const pid = overrideProjectId || projectId;
        if (!pid) return;

        const { error } = await supabase.from('activities').insert({
            project_id: pid,
            action_type,
            entity_type,
            entity_id,
            description,
            diff_summary,
            metadata
        });

        if (!error) {
            // Optimistically add to list (or refetch)
            fetchActivities();
        }
    };

    const updateActivity = async (activityId: string, updates: { diff_summary?: string }) => {
        const { error } = await supabase
            .from('activities')
            .update(updates)
            .eq('id', activityId);

        if (!error) {
            fetchActivities();
        }
        return { error };
    };

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    return {
        activities,
        loading,
        fetchActivities,
        logActivity,
        updateActivity
    };
}
