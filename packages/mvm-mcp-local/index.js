#!/usr/bin/env node

// MVM Local MCP Server
// This wraps the Cloudflare Worker MCP endpoint for Antigravity

const readline = require('readline');
const https = require('https');

const MCP_ENDPOINT = 'https://my-version-manager-mcp.kien307.workers.dev';

// Handle MCP initialization locally (required by MCP protocol)
function handleInitialize(id) {
    return {
        jsonrpc: '2.0',
        id,
        result: {
            protocolVersion: '2024-11-05',
            capabilities: {
                tools: {}
            },
            serverInfo: {
                name: 'mvm-mcp',
                version: '1.0.0'
            }
        }
    };
}

// Call remote MCP
async function callRemoteMcp(body) {
    return new Promise((resolve, reject) => {
        const url = new URL(MCP_ENDPOINT);
        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ error: { message: data } });
                }
            });
        });

        req.on('error', reject);
        req.write(JSON.stringify(body));
        req.end();
    });
}

// Handle stdin JSON-RPC
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on('line', async (line) => {
    try {
        const request = JSON.parse(line);

        // Handle initialization locally
        if (request.method === 'initialize') {
            console.log(JSON.stringify(handleInitialize(request.id)));
            return;
        }

        // Handle notifications (no response needed)
        if (request.method === 'notifications/initialized') {
            return;
        }

        // Forward other methods to remote MCP
        const response = await callRemoteMcp(request);

        // Ensure proper JSON-RPC format
        const result = {
            jsonrpc: '2.0',
            id: request.id,
            ...response
        };

        console.log(JSON.stringify(result));
    } catch (error) {
        console.log(JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32700, message: error.message },
            id: null
        }));
    }
});

// Handle process signals
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
