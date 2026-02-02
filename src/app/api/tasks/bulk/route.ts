import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiSuccess, errors, checkAuth } from '@/lib/api-utils';

interface BulkOperation {
    action: 'create' | 'update' | 'delete';
    id?: string;
    projectId?: string;
    versionId?: string;
    content?: string;
    isDone?: boolean;
    createdAt?: string;
    doneAt?: string;
}

interface OperationResult {
    action: string;
    success: boolean;
    id?: string;
    error?: string;
}

// POST /api/tasks/bulk - Bulk create/update/delete tasks
export async function POST(request: NextRequest) {
    const authError = checkAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const { operations } = body as { operations: BulkOperation[] };

    if (!operations || !Array.isArray(operations)) {
        return errors.badRequest('operations array is required');
    }

    if (operations.length > 100) {
        return errors.badRequest('Maximum 100 operations per request');
    }

    const results: OperationResult[] = [];
    let created = 0;
    let updated = 0;
    let deleted = 0;
    let failed = 0;

    for (const op of operations) {
        try {
            switch (op.action) {
                case 'create': {
                    if (!op.projectId || !op.content) {
                        results.push({ action: 'create', success: false, error: 'projectId and content required' });
                        failed++;
                        continue;
                    }

                    // Get active version if not provided
                    let targetVersionId = op.versionId;
                    if (!targetVersionId) {
                        const { data: activeVersion } = await supabase
                            .from('versions')
                            .select('id')
                            .eq('project_id', op.projectId)
                            .eq('is_active', true)
                            .single();
                        targetVersionId = activeVersion?.id || undefined;
                    }

                    const insertData: any = {
                        project_id: op.projectId,
                        version_id: targetVersionId || null,
                        content: op.content,
                        is_done: op.isDone || false,
                    };

                    if (op.createdAt) insertData.created_at = op.createdAt;
                    if (op.doneAt) insertData.done_at = op.doneAt;

                    const { data, error } = await supabase
                        .from('tasks')
                        .insert(insertData)
                        .select()
                        .single();

                    if (error) {
                        results.push({ action: 'create', success: false, error: error.message });
                        failed++;
                    } else {
                        results.push({ action: 'create', success: true, id: data.id });
                        created++;
                    }
                    break;
                }

                case 'update': {
                    if (!op.id) {
                        results.push({ action: 'update', success: false, error: 'id required' });
                        failed++;
                        continue;
                    }

                    const updates: Record<string, unknown> = {};
                    if (op.content !== undefined) updates.content = op.content;
                    if (op.isDone !== undefined) {
                        updates.is_done = op.isDone;
                        updates.done_at = op.isDone ? new Date().toISOString() : null;
                    }

                    if (Object.keys(updates).length === 0) {
                        results.push({ action: 'update', success: false, error: 'No fields to update' });
                        failed++;
                        continue;
                    }

                    const { error } = await supabase
                        .from('tasks')
                        .update(updates)
                        .eq('id', op.id);

                    if (error) {
                        results.push({ action: 'update', success: false, id: op.id, error: error.message });
                        failed++;
                    } else {
                        results.push({ action: 'update', success: true, id: op.id });
                        updated++;
                    }
                    break;
                }

                case 'delete': {
                    if (!op.id) {
                        results.push({ action: 'delete', success: false, error: 'id required' });
                        failed++;
                        continue;
                    }

                    const { error } = await supabase
                        .from('tasks')
                        .delete()
                        .eq('id', op.id);

                    if (error) {
                        results.push({ action: 'delete', success: false, id: op.id, error: error.message });
                        failed++;
                    } else {
                        results.push({ action: 'delete', success: true, id: op.id });
                        deleted++;
                    }
                    break;
                }

                default:
                    results.push({ action: op.action, success: false, error: 'Invalid action. Use create, update, or delete.' });
                    failed++;
            }
        } catch (err) {
            results.push({ action: op.action, success: false, error: String(err) });
            failed++;
        }
    }

    return apiSuccess({
        created,
        updated,
        deleted,
        failed,
        total: operations.length,
        results,
    });
}
