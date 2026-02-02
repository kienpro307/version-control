import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiSuccess, errors, checkAuth } from '@/lib/api-utils';

// GET /api/projects/:id/versions - List versions for a project
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = checkAuth(request);
    if (authError) return authError;

    const { id: projectId } = await params;

    const { data, error } = await supabase
        .from('versions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

    if (error) {
        return errors.serverError(error.message);
    }

    const versions = (data || []).map(v => ({
        id: v.id,
        projectId: v.project_id,
        name: v.name,
        isActive: v.is_active,
        createdAt: v.created_at,
    }));

    return apiSuccess(versions, { total: versions.length });
}

// POST /api/projects/:id/versions - Create a new version
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = checkAuth(request);
    if (authError) return authError;

    const { id: projectId } = await params;
    const body = await request.json();
    const { name, migratePendingTasks = false } = body;

    if (!name || typeof name !== 'string') {
        return errors.badRequest('name is required');
    }

    // Deactivate all other versions
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
        return errors.serverError(error.message);
    }

    // Migrate pending tasks if requested
    if (migratePendingTasks) {
        await supabase
            .from('tasks')
            .update({ version_id: data.id })
            .eq('project_id', projectId)
            .eq('is_done', false);
    }

    return apiSuccess({
        id: data.id,
        projectId: data.project_id,
        name: data.name,
        isActive: data.is_active,
        createdAt: data.created_at,
        migratedTasks: migratePendingTasks,
    });
}
