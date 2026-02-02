// Direct Supabase Query
const { createClient } = require('@supabase/supabase-js');

// Credentials from local .env.local
const SUPABASE_URL = 'https://xggrigjnrecjtgfhjpkr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nzRdgGAk0Fvj06qJmHTDNQ_ku6K4Uju';

const PROJECT_NAME = 'All Translate React Native';

async function main() {
    console.log('🔍 Checking for DUPLICATE projects via Supabase Direct...');

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Find ALL Projects with name
    const { data: projects, error: pErr } = await supabase
        .from('projects')
        .select('*')
        .eq('name', PROJECT_NAME)
        .order('created_at', { ascending: false });

    if (pErr) return;

    for (const project of projects) {
        console.log(`\n------------------------------------------------`);
        console.log(`📁 Project ID: ${project.id}`);
        console.log(`   Project Created: ${project.created_at}`);

        // Get Versions
        const { data: versions } = await supabase
            .from('versions')
            .select('*')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false }) // Newest first
            .limit(1);

        if (versions && versions.length > 0) {
            console.log(`   Latest Version CreatedAt: ${versions[0].created_at}`);

            const verDate = new Date(versions[0].created_at);
            if (verDate.getFullYear() === 2026 && verDate.getMonth() === 0) { // Jan 2026 implies backdated logic worked (roughly)
                console.log(`   ✅ LOOKS BACKDATED (Good)`);
            } else if (verDate.getFullYear() === 2026 && verDate.getMonth() === 1 && verDate.getDate() === 2) {
                console.log(`   ❌ LOOKS LIKE TODAY (Bad)`);
            } else {
                console.log(`   ❓ Unknown date state`);
            }
        } else {
            console.log(`   ⚠️ NO VERSIONS`);
        }
    }
}

main().catch(console.error);
