import { ParsedCommand } from './commandParser';
import { SupabaseClient } from '@supabase/supabase-js';

type ExecutionResult = {
    success: boolean;
    message: string;
    data?: unknown;
};

export async function executeCommand(
    command: ParsedCommand,
    supabase: SupabaseClient
): Promise<ExecutionResult> {
    if (command.confidence < 0.8) {
        return {
            success: false,
            message: 'Command confidence too low for automatic execution.',
        };
    }

    try {
        switch (command.action) {
            case 'update_progress':
                return await handleUpdateProgress(command.data, supabase);
            case 'create_task':
                return await handleCreateTask(command.data, supabase);
            case 'complete_task':
                return await handleCompleteTask(command.data, supabase);
            case 'switch_version':
                // Client-side only action, usually handled by UI before calling this,
                // or returns a signal to UI.
                return {
                    success: true,
                    message: `Switched to version ${command.data.version} in project ${command.data.project}`,
                    data: { type: 'CLIENT_NAVIGATION', ...command.data }
                };
            default:
                return {
                    success: false,
                    message: `Unknown action: ${command.action}`,
                };
        }
    } catch (error: unknown) {
        console.error('Execution Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
            success: false,
            message: `Execution failed: ${errorMessage}`,
        };
    }
}

async function handleUpdateProgress(data: unknown, supabase: SupabaseClient): Promise<ExecutionResult> {
    const { project, percentage } = data as { project: string; percentage: number };

    // 1. Find Project ID by Name (Simple fuzzy match or exact match)
    // For now, assuming relatively exact match or relying on UI to resolve ID.
    // Ideally, the Parser should have resolved ID if it had context, 
    // but here we might need to search.

    // Let's try to find the project
    const { data: projects, error: searchError } = await supabase
        .from('projects')
        .select('id, name')
        .ilike('name', project)
        .limit(1);

    if (searchError || !projects || projects.length === 0) {
        return { success: false, message: `Project not found: ${project}` };
    }

    const projectId = projects[0].id;

    const { error: updateError } = await supabase
        .from('projects')
        .update({ progress: percentage })
        .eq('id', projectId);

    if (updateError) throw updateError;

    return {
        success: true,
        message: `Updated progress for ${projects[0].name} to ${percentage}%`,
        data: { projectId, progress: percentage }
    };
}

async function handleCreateTask(data: unknown, supabase: SupabaseClient): Promise<ExecutionResult> {
    const { content, project } = data as { content: string; project: string };

    // 1. Find Project
    const { data: projects, error: searchError } = await supabase
        .from('projects')
        .select('id, name')
        .ilike('name', project)
        .limit(1);

    if (searchError || !projects || projects.length === 0) {
        return { success: false, message: `Project not found: ${project}` };
    }
    const projectId = projects[0].id;

    // 2. Create Task (default to inbox/backlog if no version specified)
    const { data: newTask, error: createError } = await supabase
        .from('tasks')
        .insert({
            project_id: projectId,
            content: content,
            is_done: false,
            position: 0 // Should ideally fetch max position
        })
        .select()
        .single();

    if (createError) throw createError;

    return {
        success: true,
        message: `Created task in ${projects[0].name}`,
        data: newTask
    };
}

async function handleCompleteTask(data: unknown, supabase: SupabaseClient): Promise<ExecutionResult> {
    const { content } = data as { content: string };

    // 1. Find Task (Best effort match on content)
    // This is risky without project context, but per spec:
    const { data: tasks, error: searchError } = await supabase
        .from('tasks')
        .select('id, content, project_id')
        .ilike('content', `%${content}%`)
        .eq('is_done', false)
        .limit(1);

    if (searchError || !tasks || tasks.length === 0) {
        return { success: false, message: `Task not found: ${content}` };
    }

    const task = tasks[0];

    const { error: updateError } = await supabase
        .from('tasks')
        .update({
            is_done: true,
            done_at: new Date().toISOString()
        })
        .eq('id', task.id);

    if (updateError) throw updateError;

    return {
        success: true,
        message: `Marked task as done: ${task.content}`,
        data: { taskId: task.id }
    };
}
