// Bulk insert tasks for AllTranslate project
// Run: npx ts-node scripts/bulk-insert-alltranslate.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xggrigjnrecjtgfhjpkr.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_nzRdgGAk0Fvj06qJmHTDNQ_ku6K4Uju';

const supabase = createClient(supabaseUrl, supabaseKey);

const PROJECT_ID = 'b5f5d972-77c3-4f52-9a7d-5293b045df07'; // Android/All Translate React Native

async function main() {
    console.log('🚀 Bulk inserting tasks for AllTranslate project...\\n');

    // 1. Get all versions
    const { data: versions, error: versionError } = await supabase
        .from('versions')
        .select('id, name')
        .eq('project_id', PROJECT_ID)
        .order('name');

    if (versionError) throw versionError;

    console.log(`✅ Found ${versions?.length || 0} versions`);

    if (!versions || versions.length === 0) {
        console.log('❌ No versions found. Create versions first.');
        return;
    }

    // 2. Example: Add tasks to each version
    // Thay đổi mảng tasks này theo tasks thực tế của bạn
    const tasksPerVersion = [
        'Implement feature X',
        'Fix bug Y',
        'Update documentation',
    ];

    let totalCreated = 0;

    for (const version of versions) {
        console.log(`\\n📦 Processing ${version.name}...`);

        for (const taskContent of tasksPerVersion) {
            // Check if task already exists
            const { data: existingTasks } = await supabase
                .from('tasks')
                .select('id')
                .eq('project_id', PROJECT_ID)
                .eq('version_id', version.id)
                .eq('content', taskContent);

            if (existingTasks && existingTasks.length > 0) {
                console.log(`  ⏭️  Skip: "${taskContent}"`);
                continue;
            }

            // Insert new task
            const { error: insertError } = await supabase.from('tasks').insert({
                project_id: PROJECT_ID,
                version_id: version.id,
                content: taskContent,
                is_done: false,
                position: tasksPerVersion.indexOf(taskContent),
            });

            if (insertError) {
                console.error(`  ❌ Error inserting "${taskContent}":`, insertError.message);
            } else {
                console.log(`  ✅ Added: "${taskContent}"`);
                totalCreated++;
            }
        }
    }

    console.log(`\\n🎉 Done! Created ${totalCreated} tasks across ${versions.length} versions.`);
    console.log('\\n🔗 Open http://localhost:3000 to see the updates.');
}

main().catch(console.error);
