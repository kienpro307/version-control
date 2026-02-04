'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Settings } from '@/lib/types';

export function useSettings() {
    const [settings, setSettings] = useState<Settings>({ lastProjectId: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows, which is fine
            setError(error.message);
        } else if (data) {
            setSettings({ lastProjectId: data.last_project_id });
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line
        fetchSettings();
    }, [fetchSettings]);

    const updateLastProject = useCallback(async (projectId: string): Promise<boolean> => {  
        // Check if settings row exists
        const { data: existing } = await supabase
            .from('settings')
            .select('id')
            .limit(1)
            .single();

        let result;
        if (existing) {
            result = await supabase
                .from('settings')
                .update({ last_project_id: projectId })
                .eq('id', existing.id);
        } else {
            result = await supabase
                .from('settings')
                .insert({ last_project_id: projectId });
        }

        if (result.error) {
            setError(result.error.message);
            return false;
        }

        setSettings({ lastProjectId: projectId });
        return true;
    }, []);

    return {
        settings,
        loading,
        error,
        updateLastProject,
        refetch: fetchSettings,
    };
}
