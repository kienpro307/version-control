import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ContextDump {
    id: string;
    project_id: string;
    mental_model: string | null;
    next_step_prompt: string | null;
    last_artifacts: Record<string, unknown>;
    workspace_location: 'office' | 'home';
    is_read: boolean;
    created_at: string;
}

export interface CreateContextDumpInput {
    mental_model?: string;
    next_step_prompt?: string;
    last_artifacts?: Record<string, unknown>;
    workspace_location?: 'office' | 'home';
}

export function useContextDumps(projectId: string | null) {
    const [contextDumps, setContextDumps] = useState<ContextDump[]>([]);
    const [latestDump, setLatestDump] = useState<ContextDump | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchContextDumps = useCallback(async (limit = 10) => {
        if (!projectId) {
            setContextDumps([]);
            setLatestDump(null);
            return;
        }

        setLoading(true);
        const { data, error } = await supabase
            .from('context_dumps')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (!error && data) {
            setContextDumps(data);
            setLatestDump(data[0] || null);
        }
        setLoading(false);
    }, [projectId]);

    const createContextDump = async (input: CreateContextDumpInput) => {
        if (!projectId) return null;

        const { data, error } = await supabase
            .from('context_dumps')
            .insert({
                project_id: projectId,
                mental_model: input.mental_model || null,
                next_step_prompt: input.next_step_prompt || null,
                last_artifacts: input.last_artifacts || {},
                workspace_location: input.workspace_location || 'office'
            })
            .select()
            .single();

        if (!error && data) {
            fetchContextDumps();
            return data as ContextDump;
        }
        return null;
    };

    const markAsRead = async (dumpId: string) => {
        const { error } = await supabase
            .from('context_dumps')
            .update({ is_read: true })
            .eq('id', dumpId);

        if (!error) {
            setContextDumps(prev =>
                prev.map(d => d.id === dumpId ? { ...d, is_read: true } : d)
            );
            if (latestDump?.id === dumpId) {
                setLatestDump(prev => prev ? { ...prev, is_read: true } : null);
            }
        }
    };

    const getUnreadDump = useCallback(() => {
        return contextDumps.find(d => !d.is_read) || null;
    }, [contextDumps]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchContextDumps();
    }, [fetchContextDumps]);

    return {
        contextDumps,
        latestDump,
        loading,
        fetchContextDumps,
        createContextDump,
        markAsRead,
        getUnreadDump
    };
}
