#!/usr/bin/env ts-node
/**
 * MVM Setup Verification Script
 * 
 * Checks:
 * - Environment variables
 * - Supabase connection
 * - Database schema
 * - MCP server readiness
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// ANSI Colors
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
};

function log(emoji: string, message: string, color = colors.reset) {
    console.log(`${emoji} ${color}${message}${colors.reset}`);
}

async function main() {
    console.log('\n📋 MVM Setup Verification\n');
    let hasErrors = false;

    // 1. Check .env.local
    log('🔍', 'Checking environment variables...', colors.cyan);
    const envPath = path.join(process.cwd(), '.env.local');

    if (!fs.existsSync(envPath)) {
        log('❌', '.env.local not found! Copy .env.example to .env.local', colors.red);
        hasErrors = true;
    } else {
        log('✅', '.env.local exists', colors.green);
    }

    // 2. Load environment
    require('dotenv').config({ path: envPath });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const apiSecret = process.env.API_SECRET_KEY;

    if (!supabaseUrl || supabaseUrl.includes('your-project')) {
        log('❌', 'NEXT_PUBLIC_SUPABASE_URL not configured', colors.red);
        hasErrors = true;
    } else {
        log('✅', `Supabase URL: ${supabaseUrl}`, colors.green);
    }

    if (!supabaseKey || supabaseKey.includes('your-anon')) {
        log('❌', 'NEXT_PUBLIC_SUPABASE_ANON_KEY not configured', colors.red);
        hasErrors = true;
    } else {
        log('✅', 'Supabase anon key configured', colors.green);
    }

    if (!apiSecret || apiSecret.includes('your-generated')) {
        log('⚠️', 'API_SECRET_KEY not configured (required for REST API)', colors.yellow);
    } else {
        log('✅', 'API secret key configured', colors.green);
    }

    // 3. Test Supabase connection
    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
        log('🔍', 'Testing Supabase connection...', colors.cyan);

        try {
            const supabase = createClient(supabaseUrl, supabaseKey);

            // Test connection by querying projects
            const { data, error } = await supabase
                .from('projects')
                .select('id')
                .limit(1);

            if (error) {
                log('❌', `Database error: ${error.message}`, colors.red);
                log('💡', 'Make sure you ran the SQL migrations in Supabase dashboard', colors.yellow);
                hasErrors = true;
            } else {
                log('✅', 'Database connection successful', colors.green);
                log('✅', `Found ${data?.length || 0} projects`, colors.green);
            }
        } catch (err) {
            log('❌', `Connection failed: ${err}`, colors.red);
            hasErrors = true;
        }
    }

    // 4. Check MCP config (optional)
    log('🔍', 'Checking MCP configuration...', colors.cyan);
    const mcpPaths = [
        path.join(process.env.USERPROFILE || process.env.HOME || '', '.gemini', 'antigravity', 'mcp_config.json'),
        path.join(process.env.USERPROFILE || process.env.HOME || '', '.cursor', 'mcp.json'),
    ];

    let mcpFound = false;
    for (const mcpPath of mcpPaths) {
        if (fs.existsSync(mcpPath)) {
            log('✅', `MCP config found: ${mcpPath}`, colors.green);
            mcpFound = true;
            break;
        }
    }

    if (!mcpFound) {
        log('⚠️', 'No MCP config found (AI agent integration not set up)', colors.yellow);
        log('💡', 'See docs/MCP_INTEGRATION.md for setup instructions', colors.cyan);
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    if (hasErrors) {
        log('❌', 'Setup incomplete. Please fix the errors above.', colors.red);
        process.exit(1);
    } else {
        log('✅', 'All checks passed! MVM is ready to use.', colors.green);
        log('🚀', 'Run: npm run dev', colors.cyan);
    }
    console.log('='.repeat(50) + '\n');
}

main().catch(console.error);
