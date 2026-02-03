export interface ParsedCommand {
    action: 'update_progress' | 'create_task' | 'complete_task' | 'switch_version' | null;
    data: Record<string, unknown>;
    confidence: number;
}

export function parseAICommand(input: string): ParsedCommand {
    const cleanInput = input.trim();

    // Pattern: "Update [Project] progress to [N]%" OR "Cập nhật tiến độ [Project] lên [N]%"
    const updateProgressRegex = /(?:Update|Cập nhật)\s+(?:tiến độ\s+)?(.+?)\s+(?:progress\s+to|lên)\s+(\d+)%/i;
    const updateProgressMatch = cleanInput.match(updateProgressRegex);
    if (updateProgressMatch) {
        return {
            action: 'update_progress',
            data: {
                project: updateProgressMatch[1],
                percentage: parseInt(updateProgressMatch[2], 10),
            },
            confidence: 1.0,
        };
    }

    // Pattern: "Create task [Content] in [Project]" OR "Thêm task: [Content] vào [Project]"
    const createTaskRegex = /(?:Create|Thêm)\s+task\s*(?::)?\s+(.+?)\s+(?:in|vào)\s+(.+)/i;
    const createTaskMatch = cleanInput.match(createTaskRegex);
    if (createTaskMatch) {
        return {
            action: 'create_task',
            data: {
                content: createTaskMatch[1],
                project: createTaskMatch[2],
            },
            confidence: 1.0,
        };
    }

    // Pattern: "Finish task [Content]" OR "Hoàn thành task [Content]"
    const completeTaskRegex = /(?:Finish|Hoàn thành)\s+task\s+(.+)/i;
    const completeTaskMatch = cleanInput.match(completeTaskRegex);
    if (completeTaskMatch) {
        return {
            action: 'complete_task',
            data: {
                content: completeTaskMatch[1],
            },
            confidence: 1.0,
        };
    }

    // Pattern: "Switch to [Project] version [Version]" OR "Chuyển sang [Project] phiên bản [Version]"
    const switchVersionRegex = /(?:Switch to|Chuyển sang)\s+(.+?)\s+(?:version|phiên bản)\s+(.+)/i;
    const switchVersionMatch = cleanInput.match(switchVersionRegex);
    if (switchVersionMatch) {
        return {
            action: 'switch_version',
            data: {
                project: switchVersionMatch[1],
                version: switchVersionMatch[2],
            },
            confidence: 1.0,
        };
    }

    return {
        action: null,
        data: {},
        confidence: 0,
    };
}
