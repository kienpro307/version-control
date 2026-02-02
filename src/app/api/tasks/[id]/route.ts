import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiSuccess, errors } from '@/lib/api-utils';

// PATCH /api/tasks/:id - Update a task (content, isDone)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();
    const { content, isDone } = body;

    const updates: Record<string, unknown> = {};

    if (content !== undefined) {
        updates.content = content;
    }

    if (isDone !== undefined) {
        updates.is_done = isDone;
        updates.done_at = isDone ? new Date().toISOString() : null;
    }

    if (Object.keys(updates).length === 0) {
        return errors.badRequest('No valid fields to update. Provide content or isDone.');
    }

    const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return errors.notFound('Task', id);
        }
        return errors.serverError(error.message);
    }

    return apiSuccess({
        id: data.id,
        projectId: data.project_id,
        versionId: data.version_id,
        content: data.content,
        isDone: data.is_done,
        createdAt: data.created_at,
        doneAt: data.done_at,
    });
}

// DELETE /api/tasks/:id - Delete a task
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

    if (error) {
        return errors.serverError(error.message);
    }

    return apiSuccess({ deleted: true, id });
}
