'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { AILog } from '@/lib/types';

export function useAILogs() {
    const [logs, setLogs] = useState<AILog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('ai_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            setError(error.message);
        } else if (data) {
            setLogs(data as AILog[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line
        fetchLogs();
    }, [fetchLogs]);

    const logAICommand = async (
        command: string,
        interpretedAction: string | null,
        result: unknown,
        status: 'success' | 'failure' | 'pending',
        executionTimeMs: number | null
    ) => {
        const { data, error } = await supabase
            .from('ai_logs')
            .insert({
                command,
                interpreted_action: interpretedAction,
                result,
                status,
                execution_time_ms: executionTimeMs,
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to log AI command:', error);
            setError(error.message);
            return null;
        }

        const newLog = data as AILog;
        setLogs((prev) => [newLog, ...prev]);
        return newLog;
    };

    return {
        logs,
        loading,
        error,
        logAICommand,
        refetch: fetchLogs,
    };
}
