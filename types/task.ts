// types/task.ts
export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee_id: string | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  order_index: number;
  assignee?: {
    id: string;
    username: string;
    email: string;
    avatar_url?: string;
  } | null;
  project?: {
    id: string;
    name: string;
    color: string;
  };
  subtasks?: Subtask[];
  comments?: Comment[];
  attachments?: Attachment[];
  activity_logs?: ActivityLog[];
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export interface Attachment {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export interface CreateTaskInput {
  project_id: string;
  title: string;
  description?: string;
  priority: Task['priority'];
  assignee_id?: string | null;
  due_date?: string | null;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string;
  status?: Task['status'];
}