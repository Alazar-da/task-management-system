// services/taskService.ts - Fixed version

import { createClient } from "@/lib/supabase/client";
import { Task, CreateTaskInput, UpdateTaskInput } from "@/types/task";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "react-hot-toast";

const supabase = createClient();

export const taskService = {
  async getTasks(projectId?: string): Promise<Task[]> {
    try {
      let query = supabase
        .from("tasks")
        .select(`
          id,
          project_id,
          title,
          description,
          status,
          priority,
          assignee_id,
          due_date,
          created_by,
          created_at,
          updated_at,
          order_index
        `)
        .order('order_index', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data: tasksData, error: tasksError } = await query;
      
      if (tasksError) throw tasksError;

      if (!tasksData || tasksData.length === 0) {
        return [];
      }

      // Get project details
      const projectIds = [...new Set(tasksData.map(t => t.project_id))];
      const { data: projectsData } = await supabase
        .from("projects")
        .select("id, name, color")
        .in("id", projectIds);

      const projectMap = new Map();
      projectsData?.forEach(p => projectMap.set(p.id, p));

      // Get assignee details
      const assigneeIds = tasksData
        .map(task => task.assignee_id)
        .filter(id => id !== null);

      let assigneesMap = new Map();
      if (assigneeIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, email, avatar_url")
          .in("id", assigneeIds);

        profilesData?.forEach(profile => {
          assigneesMap.set(profile.id, profile);
        });
      }

      return tasksData.map(task => ({
        ...task,
        project: projectMap.get(task.project_id),
        assignee: task.assignee_id ? assigneesMap.get(task.assignee_id) || null : null
      }));
    } catch (error) {
      console.error("Error in getTasks:", error);
      throw error;
    }
  },

 // services/taskService.ts - Updated getTask function

async getTask(id: string): Promise<Task> {
  try {
    // Get task data
    const { data: taskData, error: taskError } = await supabase
      .from("tasks")
      .select(`
        id,
        project_id,
        title,
        description,
        status,
        priority,
        assignee_id,
        due_date,
        created_by,
        created_at,
        updated_at,
        order_index
      `)
      .eq("id", id)
      .maybeSingle();

    if (taskError) throw taskError;

    if (!taskData) {
      throw new Error("Task not found");
    }

    // Get project
    const { data: projectData } = await supabase
      .from("projects")
      .select("id, name, color")
      .eq("id", taskData.project_id)
      .maybeSingle();

    // Get assignee
    let assignee = null;
    if (taskData.assignee_id) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username, email, avatar_url")
        .eq("id", taskData.assignee_id)
        .maybeSingle();

      if (profileData) assignee = profileData;
    }

    // Get subtasks
    const { data: subtasks, error: subtasksError } = await supabase
      .from("subtasks")
      .select("*")
      .eq("task_id", id)
      .order('created_at', { ascending: true });

    if (subtasksError) {
      console.error("Error fetching subtasks:", subtasksError);
    }

    // Get comments with user details - FIXED
    const { data: commentsData, error: commentsError } = await supabase
      .from("task_comments")
      .select("*")
      .eq("task_id", id)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
    }

    // Get user details for comments
    let comments = [];
    if (commentsData && commentsData.length > 0) {
      const userIds = commentsData.map(c => c.user_id).filter(id => id !== null);
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", userIds);

        const profileMap = new Map();
        profilesData?.forEach(p => profileMap.set(p.id, p));

        comments = commentsData.map(comment => ({
          ...comment,
          user: comment.user_id ? profileMap.get(comment.user_id) || null : null
        }));
      } else {
        comments = commentsData.map(comment => ({
          ...comment,
          user: null
        }));
      }
    }

    // Get attachments
    const { data: attachments, error: attachmentsError } = await supabase
      .from("task_attachments")
      .select("*")
      .eq("task_id", id)
      .order('created_at', { ascending: false });

    if (attachmentsError) {
      console.error("Error fetching attachments:", attachmentsError);
    }

    // Get activity logs with user details
    const { data: activityData, error: activityError } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("task_id", id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (activityError) {
      console.error("Error fetching activity logs:", activityError);
    }

    // Get user details for activity logs
    let activityLogs = [];
    if (activityData && activityData.length > 0) {
      const userIds = activityData.map(a => a.user_id).filter(id => id !== null);
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", userIds);

        const profileMap = new Map();
        profilesData?.forEach(p => profileMap.set(p.id, p));

        activityLogs = activityData.map(log => ({
          ...log,
          user: log.user_id ? profileMap.get(log.user_id) || null : null
        }));
      } else {
        activityLogs = activityData.map(log => ({
          ...log,
          user: null
        }));
      }
    }

    return {
      ...taskData,
      project: projectData || undefined,
      assignee: assignee || undefined,
      subtasks: subtasks || [],
      comments: comments || [],
      attachments: attachments || [],
      activity_logs: activityLogs || [],
    };
  } catch (error) {
    console.error("Error in getTask:", error);
    throw error;
  }
},

  async createTask(input: CreateTaskInput): Promise<Task> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          ...input,
          created_by: user.id,
          status: 'todo',
          order_index: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Add assignee to project if set
      if (input.assignee_id) {
        try {
          await supabase
            .from("project_members")
            .upsert({
              project_id: input.project_id,
              user_id: input.assignee_id,
              role: 'member',
            }, { onConflict: 'project_id,user_id' });
        } catch (memberError) {
          console.error("Error adding assignee to project:", memberError);
        }
      }

      // Log activity
      await taskService.logActivity(data.id, 'created', { 
        title: data.title 
      });

      return data;
    } catch (error) {
      console.error("Error in createTask:", error);
      throw error;
    }
  },

  async updateTask(input: UpdateTaskInput): Promise<Task> {
    try {
      const { id, ...updates } = input;
      
      // Get old task data
      const { data: oldTask } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", id)
        .single();

      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // If assignee changed, add new assignee to project
      if (updates.assignee_id && updates.assignee_id !== oldTask?.assignee_id) {
        try {
          await supabase
            .from("project_members")
            .upsert({
              project_id: data.project_id,
              user_id: updates.assignee_id,
              role: 'member',
            }, { onConflict: 'project_id,user_id' });
        } catch (memberError) {
          console.error("Error adding assignee to project:", memberError);
        }
      }

      // Log activity
      if (oldTask) {
        const changes: any = {};
        for (const key of Object.keys(updates)) {
          if (oldTask[key] !== (updates as any)[key]) {
            changes[key] = { from: oldTask[key], to: (updates as any)[key] };
          }
        }
        if (Object.keys(changes).length > 0) {
          await taskService.logActivity(id, 'updated', { changes });
        }
      }

      return data;
    } catch (error) {
      console.error("Error in updateTask:", error);
      throw error;
    }
  },

  async deleteTask(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error in deleteTask:", error);
      throw error;
    }
  },

  async updateTaskStatus(id: string, status: string): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      await taskService.logActivity(id, 'status_changed', { 
        status 
      });

      return data;
    } catch (error) {
      console.error("Error in updateTaskStatus:", error);
      throw error;
    }
  },

  async addSubtask(taskId: string, title: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("subtasks")
        .insert({
          task_id: taskId,
          title,
        });

      if (error) throw error;

      await taskService.logActivity(taskId, 'subtask_added', { title });
    } catch (error) {
      console.error("Error in addSubtask:", error);
      throw error;
    }
  },

  async updateSubtask(id: string, updates: { title?: string; is_completed?: boolean }): Promise<void> {
    try {
      const { error } = await supabase
        .from("subtasks")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error in updateSubtask:", error);
      throw error;
    }
  },

  async deleteSubtask(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("subtasks")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error in deleteSubtask:", error);
      throw error;
    }
  },

  async addComment(taskId: string, content: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { error } = await supabase
        .from("task_comments")
        .insert({
          task_id: taskId,
          content,
          user_id: user.id,
        });

      if (error) throw error;

      await taskService.logActivity(taskId, 'comment_added', { 
        comment: content.substring(0, 100) 
      });
    } catch (error) {
      console.error("Error in addComment:", error);
      throw error;
    }
  },

  async uploadAttachment(taskId: string, file: File): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `task-attachments/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(fileName);

      // Save attachment record
      const { error: insertError } = await supabase
        .from("task_attachments")
        .insert({
          task_id: taskId,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: user.id,
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      await taskService.logActivity(taskId, 'attachment_added', { 
        file_name: file.name 
      });

      return publicUrl;
    } catch (error) {
      console.error("Error in uploadAttachment:", error);
      throw error;
    }
  },

  async deleteAttachment(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("task_attachments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error in deleteAttachment:", error);
      throw error;
    }
  },

  async logActivity(taskId: string, action: string, details?: any): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("activity_logs")
        .insert({
          task_id: taskId,
          action,
          details,
          user_id: user.id,
        });

      if (error) {
        console.error("Error logging activity:", error);
      }
    } catch (error) {
      console.error("Error in logActivity:", error);
    }
  },
};

// React Query Hooks
export function useTasks(projectId?: string) {
  return useQuery({
    queryKey: projectId 
      ? queryKeys.tasks.byProject(projectId)
      : queryKeys.tasks.lists(),
    queryFn: () => taskService.getTasks(projectId),
    staleTime: 2 * 60 * 1000,
  });
}

export function useTasksByProject(projectId: string) {
  return useTasks(projectId);
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id || ''),
    queryFn: () => taskService.getTask(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskService.createTask,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(data.project_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      toast.success("Task created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create task");
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskService.updateTask,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(data.project_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      toast.success("Task updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update task");
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskService.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast.success("Task deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete task");
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      taskService.updateTaskStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(data.project_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update task status");
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, content }: { taskId: string; content: string }) =>
      taskService.addComment(taskId, content),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      toast.success("Comment added!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add comment");
    },
  });
}

export function useAddSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      taskService.addSubtask(taskId, title),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      toast.success("Subtask added!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add subtask");
    },
  });
}

export function useUpdateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { title?: string; is_completed?: boolean } }) =>
      taskService.updateSubtask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update subtask");
    },
  });
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskService.deleteSubtask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast.success("Subtask deleted!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete subtask");
    },
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, file }: { taskId: string; file: File }) =>
      taskService.uploadAttachment(taskId, file),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      toast.success("File uploaded successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to upload file");
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId }: { taskId: string }) =>
      taskService.deleteAttachment(taskId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      toast.success("File deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete file");
    },
  });
}