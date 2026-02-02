import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiSuccess, errors, checkAuth } from '@/lib/api-utils';

// GET /api/search - Search across tasks, projects, versions
export async function GET(request: NextRequest) {
    const authError = checkAuth(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all'; // 'tasks', 'projects', 'versions', 'all'
    const projectId = searchParams.get('projectId');

    if (!query || query.trim().length === 0) {
        return errors.badRequest('Query parameter "q" is required');
    }

    const searchTerm = `%${query.trim()}%`;
    const results: {
        tasks?: Array<Record<string, unknown>>;
        projects?: Array<Record<string, unknown>>;
        versions?: Array<Record<string, unknown>>;
    } = {};

    // Search Tasks
    if (type === 'all' || type === 'tasks') {
        let taskQuery = supabase
            .from('tasks')
            .select('*')
            .ilike('content', searchTerm)
            .order('created_at', { ascending: false })
            .limit(20);

        if (projectId) {
            taskQuery = taskQuery.eq('project_id', projectId);
        }

        const { data: tasks, error } = await taskQuery;
        if (error) {
            return errors.serverError(error.message);
        }

        results.tasks = (tasks || []).map(t => ({
            id: t.id,
            projectId: t.project_id,
            versionId: t.version_id,
            content: t.content,
            isDone: t.is_done,
            createdAt: t.created_at,
            doneAt: t.done_at,
        }));
    }

    // Search Projects
    if (type === 'all' || type === 'projects') {
        const { data: projects, error } = await supabase
            .from('projects')
            .select('*')
            .ilike('name', searchTerm)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            return errors.serverError(error.message);
        }

        results.projects = (projects || []).map(p => ({
            id: p.id,
            name: p.name,
            groupId: p.group_id,
            createdAt: p.created_at,
        }));
    }

    // Search Versions
    if (type === 'all' || type === 'versions') {
        let versionQuery = supabase
            .from('versions')
            .select('*')
            .ilike('name', searchTerm)
            .order('created_at', { ascending: false })
            .limit(20);

        if (projectId) {
            versionQuery = versionQuery.eq('project_id', projectId);
        }

        const { data: versions, error } = await versionQuery;
        if (error) {
            return errors.serverError(error.message);
        }

        results.versions = (versions || []).map(v => ({
            id: v.id,
            projectId: v.project_id,
            name: v.name,
            isActive: v.is_active,
            createdAt: v.created_at,
        }));
    }

    return apiSuccess(results);
}
