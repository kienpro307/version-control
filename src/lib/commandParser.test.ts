import { parseAICommand, ParsedCommand } from './commandParser.js';

// Simple test runner
function runTests() {
    console.log('Running Command Parser Tests...\n');
    let passed = 0;
    let failed = 0;

    const assert = (name: string, input: string, expected: Partial<ParsedCommand>) => {
        try {
            const result = parseAICommand(input);

            const actionMatch = result.action === expected.action;
            const dataMatch = JSON.stringify(result.data) === JSON.stringify(expected.data);
            const confidenceMatch = expected.confidence !== undefined ? result.confidence === expected.confidence : true;

            if (actionMatch && dataMatch && confidenceMatch) {
                console.log(`✅ [PASS] ${name}`);
                passed++;
            } else {
                console.error(`❌ [FAIL] ${name}`);
                console.error(`   Input: "${input}"`);
                console.error(`   Expected:`, expected);
                console.error(`   Received:`, result);
                failed++;
            }
        } catch (e) {
            console.error(`❌ [ERROR] ${name}:`, e);
            failed++;
        }
    };

    // Test Case 1: Update Progress
    assert(
        'Update Progress',
        'Update MyProject progress to 80%',
        {
            action: 'update_progress',
            data: { project: 'MyProject', percentage: 80 },
            confidence: 1.0,
        }
    );

    // Test Case 2: Create Task
    assert(
        'Create Task',
        'Create task Deploy to Vercel in Deployment',
        {
            action: 'create_task',
            data: { content: 'Deploy to Vercel', project: 'Deployment' },
            confidence: 1.0,
        }
    );

    // Test Case 3: Create Task (Complex Name)
    assert(
        'Create Task (Complex)',
        'Create task Fix bug #123 in Backend API',
        {
            action: 'create_task',
            data: { content: 'Fix bug #123', project: 'Backend API' },
            confidence: 1.0,
        }
    );

    // Test Case 4: Finish Task
    assert(
        'Finish Task',
        'Finish task Refactor Sidebar',
        {
            action: 'complete_task',
            data: { content: 'Refactor Sidebar' },
            confidence: 1.0,
        }
    );

    // Test Case 5: Switch Version
    assert(
        'Switch Version',
        'Switch to Frontend version v2.0',
        {
            action: 'switch_version',
            data: { project: 'Frontend', version: 'v2.0' },
            confidence: 1.0,
        }
    );

    // Test Case 6: Invalid Command
    assert(
        'Invalid Command',
        'Hello World',
        {
            action: null,
            data: {},
            confidence: 0,
        }
    );

    // Test Case 7: Case Insensitivity
    assert(
        'Case Insensitivity',
        'update webApp pRoGreSs TO 50%',
        {
            action: 'update_progress',
            data: { project: 'webApp', percentage: 50 },
            confidence: 1.0,
        }
    );

    console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);
    if (failed > 0) process.exit(1);
}

runTests();
