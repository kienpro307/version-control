import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiSuccess, errors } from '@/lib/api-utils';

// GET /api/projects - List projects (optionally filter by groupId)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    let query = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (groupId) {
        query = query.eq('group_id', groupId);
    }

    const { data, error } = await query;

    if (error) {
        return errors.serverError(error.message);
    }

    const projects = (data || []).map(p => ({
        id: p.id,
        name: p.name,
        groupId: p.group_id,
        createdAt: p.created_at,
    }));

    return apiSuccess(projects, { total: projects.length });
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
    const body = await request.json();
    const { name, groupId } = body;

    if (!name || typeof name !== 'string') {
        return errors.badRequest('name is required');
    }

    const { data, error } = await supabase
        .from('projects')
        .insert({ name, group_id: groupId || null })
        .select()
        .single();

    if (error) {
        return errors.serverError(error.message);
    }

    return apiSuccess({
        id: data.id,
        name: data.name,
        groupId: data.group_id,
        createdAt: data.created_at,
    });
}
