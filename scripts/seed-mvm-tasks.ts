// Script to add tasks and versions for MyVersionManager project
// Run: npx ts-node scripts/seed-mvm-tasks.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xggrigjnrecjtgfhjpkr.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_nzRdgGAk0Fvj06qJmHTDNQ_ku6K4Uju';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('🚀 Seeding MyVersionManager project data...\n');

    // 1. Find or create "Web/MyVersionManager" project
    let { data: projects } = await supabase
        .from('projects')
        .select('*')
        .ilike('name', '%MyVersionManager%');

    let projectId: string;

    if (!projects || projects.length === 0) {
        console.log('Creating project "Web/MyVersionManager"...');
        const { data: newProject, error } = await supabase
            .from('projects')
            .insert({ name: 'Web/MyVersionManager', progress: 60 })
            .select()
            .single();

        if (error) throw error;
        projectId = newProject.id;
        console.log('✅ Project created:', projectId);
    } else {
        projectId = projects[0].id;
        console.log('✅ Found existing project:', projects[0].name, projectId);

        // Update progress
        await supabase.from('projects').update({ progress: 60 }).eq('id', projectId);
    }

    // 2. Create version "v0.8 - AI Integration"
    const versionName = 'v0.8 - AI Integration';
    let { data: versions } = await supabase
        .from('versions')
        .select('*')
        .eq('project_id', projectId)
        .eq('name', versionName);

    let versionId: string;

    if (!versions || versions.length === 0) {
        console.log(`Creating version "${versionName}"...`);
        const { data: newVersion, error } = await supabase
            .from('versions')
            .insert({ project_id: projectId, name: versionName, is_active: true })
            .select()
            .single();

        if (error) throw error;
        versionId = newVersion.id;
        console.log('✅ Version created:', versionId);
    } else {
        versionId = versions[0].id;
        console.log('✅ Found existing version:', versionId);
    }

    // 3. Add tasks
    const tasks = [
        'AI Logs panel trong ActivityDrawer',
        'Quick actions từ AI suggestions',
    ];

    for (const taskContent of tasks) {
        // Check if task already exists
        const { data: existingTasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', projectId)
            .eq('content', taskContent);

        if (!existingTasks || existingTasks.length === 0) {
            const { error } = await supabase.from('tasks').insert({
                project_id: projectId,
                version_id: versionId,
                content: taskContent,
                is_done: false,
                position: tasks.indexOf(taskContent),
            });

            if (error) throw error;
            console.log('✅ Task added:', taskContent);
        } else {
            console.log('⏭️ Task already exists:', taskContent);
        }
    }

    console.log('\n🎉 Done! Check http://localhost:3000 to see the updates.');
}

main().catch(console.error);
