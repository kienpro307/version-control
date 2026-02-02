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
