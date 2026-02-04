
const https = require('https');

const MCP_ENDPOINT = 'https://my-version-manager-mcp.kien307.workers.dev';

async function testCall() {
    console.log('Testing connection to:', MCP_ENDPOINT);

    const payload = {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
            name: 'list_projects',
            arguments: {}
        },
        id: 1
    };

    const parsedUrl = new URL(MCP_ENDPOINT);
    const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    };

    console.log('Sending payload:', JSON.stringify(payload));

    const req = https.request(options, (res) => {
        console.log('Response Status:', res.statusCode);
        console.log('Headers:', res.headers);

        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('Raw Response Body:', data);
            try {
                const json = JSON.parse(data);
                console.log('Parsed JSON:', JSON.stringify(json, null, 2));
            } catch (e) {
                console.error('Failed to parse JSON:', e.message);
            }
        });
    });

    req.on('error', (e) => {
        console.error('Request Error:', e);
    });

    req.write(JSON.stringify(payload));
    req.end();
}

testCall();
