import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiSuccess, errors, checkAuth } from '@/lib/api-utils';

// GET /api/groups - List all groups (tree structure)
export async function GET(request: NextRequest) {
    const authError = checkAuth(request);
    if (authError) return authError;

    const { data, error } = await supabase
        .from('project_groups')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        return errors.serverError(error.message);
    }

    // Build tree structure
    const groups = data || [];
    const groupMap = new Map(groups.map(g => [g.id, { ...g, children: [] as typeof groups }]));
    const tree: typeof groups = [];

    groups.forEach(group => {
        const node = groupMap.get(group.id)!;
        if (group.parent_id && groupMap.has(group.parent_id)) {
            groupMap.get(group.parent_id)!.children.push(node);
        } else {
            tree.push(node);
        }
    });

    return apiSuccess(tree);
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
    const authError = checkAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const { name, parentId } = body;

    if (!name || typeof name !== 'string') {
        return errors.badRequest('name is required');
    }

    const { data, error } = await supabase
        .from('project_groups')
        .insert({ name, parent_id: parentId || null })
        .select()
        .single();

    if (error) {
        return errors.serverError(error.message);
    }

    return apiSuccess({
        id: data.id,
        name: data.name,
        parentId: data.parent_id,
        createdAt: data.created_at,
    });
}
