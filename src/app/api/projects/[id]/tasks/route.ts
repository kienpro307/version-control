import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiSuccess, errors, checkAuth } from '@/lib/api-utils';

// GET /api/projects/:id/tasks - List tasks for a project
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = checkAuth(request);
    if (authError) return authError;

    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);

    const versionId = searchParams.get('versionId');
    const status = searchParams.get('status'); // 'pending', 'done', or null for all

    let query = supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

    if (versionId) {
        query = query.eq('version_id', versionId);
    }

    if (status === 'pending') {
        query = query.eq('is_done', false);
    } else if (status === 'done') {
        query = query.eq('is_done', true);
    }

    const { data, error } = await query;

    if (error) {
        return errors.serverError(error.message);
    }

    const tasks = (data || []).map(t => ({
        id: t.id,
        projectId: t.project_id,
        versionId: t.version_id,
        content: t.content,
        isDone: t.is_done,
        createdAt: t.created_at,
        doneAt: t.done_at,
        parentId: t.parent_id,
        depth: t.depth || 0,
    }));

    return apiSuccess(tasks, { total: tasks.length });
}

// POST /api/projects/:id/tasks - Create a new task
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = checkAuth(request);
    if (authError) return authError;

    const { id: projectId } = await params;
    const body = await request.json();
    const { content, versionId, parentId } = body;

    if (!content || typeof content !== 'string') {
        return errors.badRequest('content is required');
    }

    // If no versionId provided, try to get the active version
    let targetVersionId = versionId;
    if (!targetVersionId) {
        const { data: activeVersion } = await supabase
            .from('versions')
            .select('id')
            .eq('project_id', projectId)
            .eq('is_active', true)
            .single();

        targetVersionId = activeVersion?.id || null;
    }

    // Function to handle subtask logic
    let finalDepth = 0;
    let finalParentId = null;

    if (parentId) {
        // Validation: Verify parent exists
        const { data: parentTask, error: parentError } = await supabase
            .from('tasks')
            .select('id, version_id, depth')
            .eq('id', parentId)
            .single();

        if (parentError || !parentTask) {
            return errors.badRequest('Parent task not found');
        }

        if (parentTask.depth > 0) {
            return errors.badRequest('Cannot create subtask of a subtask (max depth 1)');
        }

        finalParentId = parentId;
        finalDepth = 1;
        // Subtasks inherit version from parent if not specified
        if (!targetVersionId) {
            targetVersionId = parentTask.version_id;
        }
    }

    const { data, error } = await supabase
        .from('tasks')
        .insert({
            project_id: projectId,
            version_id: targetVersionId,
            content,
            is_done: false,
            parent_id: finalParentId,
            depth: finalDepth,
        })
        .select()
        .single();

    if (error) {
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
        parentId: data.parent_id,
        depth: data.depth,
    });
}
