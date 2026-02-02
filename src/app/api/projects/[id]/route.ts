import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiSuccess, errors } from '@/lib/api-utils';

// GET /api/projects/:id - Get project details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        return errors.notFound('Project', id);
    }

    return apiSuccess({
        id: data.id,
        name: data.name,
        groupId: data.group_id,
        createdAt: data.created_at,
    });
}
