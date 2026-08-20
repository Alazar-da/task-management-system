// types/project.ts
export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
  color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  members?: ProjectMember[];
  taskCount?: number;
  inProgressCount?: number;
  completedCount?: number;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'admin' | 'member' | 'viewer';
  joined_at: string;
  user?: {
    id: string;
    username: string;
    email: string;
    avatar_url?: string;
  };
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  status: Project['status'];
  color: string;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  id: string;
}