import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiSuccess, errors, checkAuth } from '@/lib/api-utils';

// GET /api/activities - List activities for a project
export async function GET(request: NextRequest) {
    const authError = checkAuth(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!projectId) {
        return errors.badRequest('projectId is required');
    }

    const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(Math.min(limit, 100));

    if (error) {
        return errors.serverError(error.message);
    }

    const activities = (data || []).map(a => ({
        id: a.id,
        projectId: a.project_id,
        userId: a.user_id,
        actionType: a.action_type,
        entityType: a.entity_type,
        entityId: a.entity_id,
        description: a.description,
        metadata: a.metadata,
        createdAt: a.created_at,
    }));

    return apiSuccess(activities, { total: activities.length });
}

// POST /api/activities - Log an activity
export async function POST(request: NextRequest) {
    const authError = checkAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const { projectId, actionType, entityType, entityId, description, metadata, userId } = body;

    if (!projectId || !actionType || !entityType || !entityId) {
        return errors.badRequest('projectId, actionType, entityType, and entityId are required');
    }

    const { data, error } = await supabase
        .from('activities')
        .insert({
            project_id: projectId,
            user_id: userId || 'api',
            action_type: actionType,
            entity_type: entityType,
            entity_id: entityId,
            description: description || null,
            metadata: metadata || {},
        })
        .select()
        .single();

    if (error) {
        return errors.serverError(error.message);
    }

    return apiSuccess({
        id: data.id,
        projectId: data.project_id,
        userId: data.user_id,
        actionType: data.action_type,
        entityType: data.entity_type,
        entityId: data.entity_id,
        description: data.description,
        metadata: data.metadata,
        createdAt: data.created_at,
    });
}
