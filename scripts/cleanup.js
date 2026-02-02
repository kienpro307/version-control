// Direct Supabase Query
const { createClient } = require('@supabase/supabase-js');

// Credentials from local .env.local
const SUPABASE_URL = 'https://xggrigjnrecjtgfhjpkr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nzRdgGAk0Fvj06qJmHTDNQ_ku6K4Uju';

const BAD_IDS = [
    '093e7117-dde3-4eac-9d05-db84c9094d42',
    '49a8f371-9bda-4dba-992d-a7e6ce7d5814',
    'a7986f1c-9667-4aea-b40d-906c6af4e46a',
    '5ccdb81a-2ba6-4136-b601-8e9cf298402b'
];

async function main() {
    console.log('🧹 Cleaning up BAD DUPLICATE projects...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    for (const id of BAD_IDS) {
        console.log(`Deleting ${id}...`);
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) {
            console.error(`❌ Failed to delete ${id}:`, error.message);
        } else {
            console.log(`✅ Deleted ${id}`);
        }
    }
    console.log('🎉 Cleanup complete. Only the good copy remains.');
}

main().catch(console.error);
