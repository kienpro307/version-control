import { createClient } from '@supabase/supabase-js';

interface Env {
    SUPABASE_URL: string;
    SUPABASE_KEY: string;
}

// Simple JSON-RPC 2.0 Types
interface JsonRpcRequest {
    jsonrpc: string;
    method: string;
    params?: any;
    id?: number | string;
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        // 1. Setup CORS
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
            });
        }

        // 2. Only allow POST for JSON-RPC
        if (request.method !== "POST") {
            return new Response("Supabase MCP Bridge Active. Send POST requests.", { status: 200 });
        }

        try {
            const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
            const body = await request.json() as JsonRpcRequest;

            // 3. Handle Tools
            if (body.method === "tools/list") {
                return jsonRpcResponse(body.id, {
                    tools: [
                        {
                            name: "list_projects",
                            description: "List all projects",
                            inputSchema: { type: "object", properties: {} }
                        },
                        {
                            name: "update_project_progress",
                            description: "Update project progress percentage",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    projectId: { type: "string" },
                                    progress: { type: "number" }
                                },
                                required: ["projectId", "progress"]
                            }
                        },
                        {
                            name: "log_ai_action",
                            description: "Log an AI action",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    command: { type: "string" },
                                    interpreted_action: { type: "string" },
                                    result: { type: "object" },
                                    status: { type: "string" },
                                    execution_time_ms: { type: "number" }
                                },
                                required: ["command", "status"]
                            }
                        },
                        {
                            name: "get_tasks",
                            description: "Get pending tasks for a project",
                            inputSchema: {
                                type: "object",
                                properties: { projectId: { type: "string" } },
                                required: ["projectId"]
                            }
                        },
                        {
                            name: "read_context_dump",
                            description: "Read latest context dump",
                            inputSchema: {
                                type: "object",
                                properties: { projectId: { type: "string" } },
                                required: ["projectId"]
                            }
                        },
                        {
                            name: "update_project_local_path",
                            description: "Update the local filesystem path for a project",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    projectId: { type: "string" },
                                    localPath: { type: "string" }
                                },
                                required: ["projectId", "localPath"]
                            }
                        },
                        {
                            name: "list_project_files",
                            description: "List files in a project's local path (returns file tree from database lookup)",
                            inputSchema: {
                                type: "object",
                                properties: { projectId: { type: "string" } },
                                required: ["projectId"]
                            }
                        },
                        // ====== NEW TOOLS ======
                        {
                            name: "add_task",
                            description: "Add a new task to a project",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    projectId: { type: "string", description: "Project UUID" },
                                    content: { type: "string", description: "Task content/title" },
                                    versionId: { type: "string", description: "Optional version UUID" },
                                    priority: { type: "string", enum: ["none", "low", "medium", "high"] }
                                },
                                required: ["projectId", "content"]
                            }
                        },
                        {
                            name: "mark_task_done",
                            description: "Mark a task as done by fuzzy matching content",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    projectId: { type: "string", description: "Project UUID" },
                                    taskContent: { type: "string", description: "Task content to fuzzy match" }
                                },
                                required: ["projectId", "taskContent"]
                            }
                        },
                        {
                            name: "create_context_dump",
                            description: "Create a context dump for session continuity",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    projectId: { type: "string", description: "Project UUID" },
                                    mentalModel: { type: "string", description: "Current logic structure description" },
                                    nextStepPrompt: { type: "string", description: "Prompt to prime next session" },
                                    workspaceLocation: { type: "string", enum: ["office", "home"] }
                                },
                                required: ["projectId", "mentalModel"]
                            }
                        }
                    ]
                });
            }

            if (body.method === "tools/call") {
                const { name, arguments: args } = body.params || {};

                if (name === "list_projects") {
                    const { data, error } = await supabase.from('projects').select('*');
                    if (error) throw error;
                    return jsonRpcResponse(body.id, { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });
                }

                if (name === "get_tasks") {
                    const { data, error } = await supabase.from('tasks').select('*').eq('project_id', args.projectId).eq('is_done', false);
                    if (error) throw error;
                    return jsonRpcResponse(body.id, { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });
                }

                if (name === "read_context_dump") {
                    const { data, error } = await supabase.from('context_dumps').select('*').eq('project_id', args.projectId).order('created_at', { ascending: false }).limit(1).single();
                    if (error) return jsonRpcResponse(body.id, { content: [{ type: "text", text: "No dump found" }] });
                    return jsonRpcResponse(body.id, { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });
                }

                if (name === "update_project_progress") {
                    const { error } = await supabase.from('projects').update({ progress: args.progress }).eq('id', args.projectId);
                    if (error) throw error;
                    return jsonRpcResponse(body.id, { content: [{ type: "text", text: `Updated progress to ${args.progress}%` }] });
                }

                if (name === "log_ai_action") {
                    const { error } = await supabase.from('ai_logs').insert({
                        command: args.command,
                        interpreted_action: args.interpreted_action,
                        result: args.result,
                        status: args.status,
                        execution_time_ms: args.execution_time_ms
                    });
                    if (error) throw error;
                    return jsonRpcResponse(body.id, { content: [{ type: "text", text: "Logged AI action" }] });
                }

                if (name === "update_project_local_path") {
                    const { error } = await supabase.from('projects').update({ local_path: args.localPath }).eq('id', args.projectId);
                    if (error) throw error;
                    return jsonRpcResponse(body.id, { content: [{ type: "text", text: `Updated local path to ${args.localPath}` }] });
                }

                if (name === "list_project_files") {
                    const { data, error } = await supabase.from('projects').select('local_path').eq('id', args.projectId).single();
                    if (error) throw error;
                    if (!data?.local_path) {
                        return jsonRpcResponse(body.id, { content: [{ type: "text", text: "No local path set for this project. Use the UI to set one first." }] });
                    }
                    return jsonRpcResponse(body.id, { content: [{ type: "text", text: `Local path for project: ${data.local_path}\n\nNote: To list actual files, the Agent should use its native 'list_dir' tool with this path.` }] });
                }

                // ====== NEW TOOL HANDLERS ======

                if (name === "add_task") {
                    // Validate required fields
                    if (!args.content || args.content.trim() === "") {
                        return jsonRpcResponse(body.id, null, { code: -32602, message: "Invalid params: content is required" });
                    }

                    const insertData: any = {
                        project_id: args.projectId,
                        content: args.content.trim(),
                        is_done: false
                    };
                    if (args.versionId) insertData.version_id = args.versionId;
                    if (args.priority) insertData.priority = args.priority;

                    const { data, error } = await supabase.from('tasks').insert(insertData).select().single();
                    if (error) throw error;
                    return jsonRpcResponse(body.id, { content: [{ type: "text", text: `✅ Added task: "${args.content}"\nID: ${data.id}` }] });
                }

                if (name === "mark_task_done") {
                    // Validate required fields
                    if (!args.taskContent || args.taskContent.trim() === "") {
                        return jsonRpcResponse(body.id, null, { code: -32602, message: "Invalid params: taskContent is required" });
                    }

                    // Fuzzy match: get all pending tasks and find best match
                    const { data: tasks, error: fetchError } = await supabase
                        .from('tasks')
                        .select('*')
                        .eq('project_id', args.projectId)
                        .eq('is_done', false);

                    if (fetchError) throw fetchError;
                    if (!tasks || tasks.length === 0) {
                        return jsonRpcResponse(body.id, { content: [{ type: "text", text: "No pending tasks found for this project." }] });
                    }

                    // Simple fuzzy match: find task containing the search string (case-insensitive)
                    const searchLower = args.taskContent.toLowerCase();
                    const matchedTask = tasks.find(t =>
                        t.content.toLowerCase().includes(searchLower) ||
                        searchLower.includes(t.content.toLowerCase())
                    );

                    if (!matchedTask) {
                        const taskList = tasks.map(t => `- ${t.content}`).join('\n');
                        return jsonRpcResponse(body.id, { content: [{ type: "text", text: `No matching task found for "${args.taskContent}".\n\nPending tasks:\n${taskList}` }] });
                    }

                    // Mark as done
                    const { error: updateError } = await supabase
                        .from('tasks')
                        .update({ is_done: true, done_at: new Date().toISOString() })
                        .eq('id', matchedTask.id);

                    if (updateError) throw updateError;
                    return jsonRpcResponse(body.id, { content: [{ type: "text", text: `✅ Marked as done: "${matchedTask.content}"` }] });
                }

                if (name === "create_context_dump") {
                    // Validate required fields
                    if (!args.mentalModel || args.mentalModel.trim() === "") {
                        return jsonRpcResponse(body.id, null, { code: -32602, message: "Invalid params: mentalModel is required" });
                    }

                    const insertData: any = {
                        project_id: args.projectId,
                        mental_model: args.mentalModel.trim(),
                        is_read: false
                    };
                    if (args.nextStepPrompt) insertData.next_step_prompt = args.nextStepPrompt.trim();
                    if (args.workspaceLocation) insertData.workspace_location = args.workspaceLocation;

                    const { data, error } = await supabase.from('context_dumps').insert(insertData).select().single();
                    if (error) throw error;
                    return jsonRpcResponse(body.id, { content: [{ type: "text", text: `✅ Context dump created.\nID: ${data.id}\nTimestamp: ${data.created_at}` }] });
                }

                throw new Error(`Unknown tool: ${name}`);
            }

            return jsonRpcResponse(body.id, null, { code: -32601, message: "Method not found" });

        } catch (err: any) {
            return new Response(JSON.stringify({
                jsonrpc: "2.0",
                error: { code: -32000, message: err.message },
                id: null
            }), {
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
        }
    }
}

function jsonRpcResponse(id: any, result: any, error?: any) {
    const body: any = { jsonrpc: "2.0", id };
    if (error) body.error = error;
    else body.result = result;

    return new Response(JSON.stringify(body), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
}
