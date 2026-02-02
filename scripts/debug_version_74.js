// Direct Supabase Query
const { createClient } = require('@supabase/supabase-js');

// Credentials from local .env.local
const SUPABASE_URL = 'https://xggrigjnrecjtgfhjpkr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nzRdgGAk0Fvj06qJmHTDNQ_ku6K4Uju';

const PROJECT_NAME = 'All Translate React Native';
const TARGET_VERSION_NAME = 'Version 74';

async function main() {
    console.log('🔍 Debugging Version 74 specific linkage...');

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Find Project
    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('name', PROJECT_NAME);

    if (!projects || projects.length === 0) {
        console.error('❌ Project not found');
        return;
    }
    // We expect only 1 now
    const project = projects[0];
    console.log(`✅ Project: ${project.id}`);

    // 2. Find Version 74
    const { data: versions } = await supabase
        .from('versions')
        .select('*')
        .eq('project_id', project.id)
        .eq('name', TARGET_VERSION_NAME);

    if (!versions || versions.length === 0) {
        console.error(`❌ Version "${TARGET_VERSION_NAME}" not found`);
        return;
    }
    const version = versions[0];
    console.log(`✅ Version 74 ID: ${version.id}`);
    console.log(`   Created At:   ${version.created_at}`);

    // 3. Find Tasks for this Version
    const { data: tasks, error: tErr } = await supabase
        .from('tasks')
        .select('*')
        .eq('version_id', version.id);

    if (tErr) {
        console.error('❌ Error fetching tasks:', tErr);
        return;
    }

    console.log(`✅ Tasks linked directly to Version 74: ${tasks.length}`);

    if (tasks.length > 0) {
        console.log('   Sample Task:', tasks[0]);
    } else {
        console.log('   ⚠️  ZERO TASKS FOUND FOR THIS VERSION ID.');

        // 4. Broad search: Are there tasks with this version ID but maybe wrong project ID?
        const { data: globalTasks } = await supabase
            .from('tasks')
            .select('id, project_id, version_id')
            .eq('version_id', version.id);

        console.log(`   Global Search for Version ID ${version.id}: ${globalTasks?.length} tasks found.`);
        if (globalTasks?.length > 0) {
            console.log('   Tasks exist but maybe project_id mismatch?');
            console.log('   Task Project ID:', globalTasks[0].project_id);
            console.log('   Real Project ID:', project.id);
            console.log('   Match:', globalTasks[0].project_id === project.id);
        }
    }
}

main().catch(console.error);
