export interface Project {
    id: string;
    name: string;
    createdAt: string;
}

export interface Version {
    id: string;
    projectId: string;
    name: string;
    isActive: boolean;
    createdAt: string;
}

export interface Task {
    id: string;
    projectId: string;
    versionId: string | null;
    content: string;
    isDone: boolean;
    createdAt: string;
    doneAt: string | null;
    position: number;
    description?: string;
    labels?: string[];
    priority?: 'none' | 'low' | 'medium' | 'high' | 'urgent';
}

export interface Settings {
    lastProjectId: string | null;
}

export interface Activity {
    id: string;
    project_id: string;
    action_type: string;
    entity_type: string;
    entity_id: string | null;
    description: string | null;
    diff_summary: string | null;
    created_at: string;
    metadata: any;
}
