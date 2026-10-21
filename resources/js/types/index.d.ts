export type PriorityLevel = 'urgent' | 'high' | 'normal' | 'low';

export type StatusLevel = 'Backlog' | 'Todo' | 'In Progress' | 'In Review' | 'Done';

export interface User {
    id: number;
    name: string;
    email: string;
    roles?: string[];
    banned_at?: string | null;
    ban_reason?: string | null;
}

export interface MemberUser extends User {
    role: string;
    is_banned: boolean;
    workspaces: Array<{
        id: number;
        name: string;
        slug: string;
        is_private: boolean;
    }>;
    workspace_ids: number[];
    created_at: string;
}

export interface Workspace {
    id: number;
    name: string;
    slug: string;
    is_private: boolean;
    folders?: Folder[];
}

export interface Folder {
    id: number;
    workspace_id: number;
    name: string;
    prefix: string;
    current_number: number;
    custom_field_definitions?: CustomFieldDefinition[];
}

export interface CustomFieldDefinition {
    id: number;
    folder_id: number;
    name: string;
    key: string;
    type: 'text' | 'email' | 'phone' | 'datetime' | 'file' | 'users_multi' | 'record_link';
    is_required: boolean;
    options?: any;
    order_index: number;
}

export interface Attachment {
    id: number;
    name: string;
    file_name: string;
    size: number;
    human_size: string;
    mime_type: string;
    url: string;
    created_at: string;
}

export interface Subtask {
    id: number;
    parent_id: number;
    code: string;
    title: string;
    status: string;
    priority: PriorityLevel;
    assignee_id?: number | null;
    order_index: number;
}

export interface Item {
    id: number;
    folder_id: number;
    parent_id?: number | null;
    parent?: {
        id: number;
        code: string;
        title: string;
    } | null;
    code: string;
    title: string;
    description?: string | null;
    status: string;
    priority: PriorityLevel;
    assignee_id?: number | null;
    assignee?: {
        id: number;
        name: string;
        email: string;
    } | null;
    creator?: {
        id: number;
        name: string;
    } | null;
    start_date?: string | null;
    due_date?: string | null;
    deadline?: string | null;
    size?: string | null;
    impact?: string | null;
    fields_data?: Record<string, any> | null;
    order_index: number;
    subtasks_count: number;
    completed_subtasks_count: number;
    subtasks?: Subtask[];
    attachments?: Attachment[];
    created_at: string;
    updated_at: string;
}

export interface ActivityChange {
    field: string;
    old: string;
    new: string;
}

export interface ActivityEntry {
    id: number;
    causer: {
        name: string;
        email: string;
    };
    description: string;
    changes: ActivityChange[];
    created_at: string;
}
