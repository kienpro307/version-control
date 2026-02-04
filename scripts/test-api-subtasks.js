// Using native fetch (Node 18+)

// Config
const API_URL = 'http://localhost:3000/api';
const SECRET_KEY = 'mvm_sk_live_your_secret_key_here'; // Using key from .env.local
const PROJECT_ID = 'your-project-id'; // Replace with a valid project ID for testing

async function testSubtasks() {
    console.log('🚀 Starting Subtask API Test...');

    // 1. Get Project ID (if not hardcoded)
    let projectId = PROJECT_ID;
    if (projectId === 'your-project-id') {
        // Try to fetch first project
        const res = await fetch(`${API_URL}/projects`, {
            headers: { 'Authorization': `Bearer ${SECRET_KEY}` }
        });
        const data = await res.json();
        if (data.data && data.data.length > 0) {
            projectId = data.data[0].id;
            console.log(`Using Project ID: ${projectId}`);
        } else {
            console.error('❌ No projects found. Create a project first.');
            return;
        }
    }

    // 2. Create Parent Task
    console.log('\n📝 Creating Parent Task...');
    const parentRes = await fetch(`${API_URL}/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SECRET_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content: "API Test Parent Task " + Date.now()
        })
    });
    const parentData = await parentRes.json();
    if (!parentData.success) {
        console.error('❌ Failed to create parent task:', parentData);
        return;
    }
    const parentId = parentData.data.id;
    console.log(`✅ Parent Task Created: ${parentId} (Depth: ${parentData.data.depth})`);

    // 3. Create Subtask
    console.log('\n📝 Creating Subtask...');
    const subtaskRes = await fetch(`${API_URL}/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SECRET_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content: "API Test Subtask",
            parentId: parentId
        })
    });
    const subtaskData = await subtaskRes.json();
    if (!subtaskData.success) {
        console.error('❌ Failed to create subtask:', subtaskData);
        return;
    }
    const subtaskId = subtaskData.data.id;
    console.log(`✅ Subtask Created: ${subtaskId} (Parent: ${subtaskData.data.parentId}, Depth: ${subtaskData.data.depth})`);

    if (subtaskData.data.parentId === parentId && subtaskData.data.depth === 1) {
        console.log('✅ Subtask validation passed!');
    } else {
        console.error('❌ Subtask validation failed!');
    }

    // 4. Test Grandchild (Should Fail)
    console.log('\n📝 Testing Grandchild Creation (Should Fail)...');
    const grandRes = await fetch(`${API_URL}/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SECRET_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content: "API Test Grandchild",
            parentId: subtaskId
        })
    });
    const grandData = await grandRes.json();
    if (!grandData.success) {
        console.log('✅ Grandchild creation failed as expected:', grandData.error);
    } else {
        console.error('❌ Grandchild creation succeeded unexpectedly!', grandData);
    }

    // 5. Clean up
    console.log('\n🧹 Cleaning up...');
    await fetch(`${API_URL}/tasks/${parentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${SECRET_KEY}` }
    });
    console.log('✅ Cleanup done.');
}

testSubtasks();
