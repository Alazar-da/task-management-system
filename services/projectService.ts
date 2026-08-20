// services/projectService.ts
import { createClient } from "@/lib/supabase/client";
import { Project, ProjectMember, CreateProjectInput, UpdateProjectInput } from "@/types/project";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "react-hot-toast";

const supabase = createClient();

// Fetch Functions
export const projectService = {
  async getProjects(): Promise<Project[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user");
        return [];
      }

      console.log("Fetching projects for user:", user.id);

      // First, get projects with their members
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          project_members!left (
            id,
            user_id,
            role,
            joined_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching projects:", error);
        throw error;
      }

      console.log("Projects fetched:", data);

      // Get all member details from profiles
      const projectsWithMembers = await Promise.all(
        (data || []).map(async (project: any) => {
          let members = [];
          
          if (project.project_members && project.project_members.length > 0) {
            const userIds = project.project_members.map((pm: any) => pm.user_id);
            
            // Fetch user details from profiles
            const { data: userData, error: userError } = await supabase
              .from("profiles")
              .select("id, username, email, avatar_url")
              .in("id", userIds);

            if (userError) {
              console.error("Error fetching user details:", userError);
            } else {
              // Combine member data with user details
              members = project.project_members.map((pm: any) => ({
                ...pm,
                user: userData?.find((u: any) => u.id === pm.user_id)
              }));
            }
          }

          return {
            ...project,
            members,
            taskCount: 0, // We'll fetch task count separately
          };
        })
      );

      // Get task counts for each project
      for (const project of projectsWithMembers) {
        const { count, error: countError } = await supabase
          .from("tasks")
          .select("*", { count: 'exact', head: true })
          .eq("project_id", project.id);

        if (!countError) {
          project.taskCount = count || 0;
        }
      }

      return projectsWithMembers;
    } catch (error) {
      console.error("Error in getProjects:", error);
      throw error;
    }
  },

async getProject(id: string): Promise<Project> {
  try {
    console.log("Fetching project with ID:", id);
    
    // Get project details
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select(`
        *,
        project_members!left (
          id,
          user_id,
          role,
          joined_at
        )
      `)
      .eq("id", id)
      .single();

    if (projectError) {
      console.error("Error fetching project:", projectError);
      throw projectError;
    }

    console.log("Project data:", projectData);

    // Get member details from profiles
    let members = [];
    if (projectData.project_members && projectData.project_members.length > 0) {
      const userIds = projectData.project_members.map((pm: any) => pm.user_id);
      
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id, username, email, avatar_url")
        .in("id", userIds);

      if (userError) {
        console.error("Error fetching user details:", userError);
      } else {
        members = projectData.project_members.map((pm: any) => ({
          ...pm,
          user: userData?.find((u: any) => u.id === pm.user_id)
        }));
      }
    }

    // Get task counts
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("status")
      .eq("project_id", id);

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
    }

    const taskCount = tasks?.length || 0;
    const inProgressCount = tasks?.filter(t => t.status === 'in_progress').length || 0;
    const completedCount = tasks?.filter(t => t.status === 'done').length || 0;

    console.log("Task counts:", { taskCount, inProgressCount, completedCount });

    return {
      ...projectData,
      members,
      taskCount,
      inProgressCount,
      completedCount,
    };
  } catch (error) {
    console.error("Error in getProject:", error);
    throw error;
  }
},

  async createProject(input: CreateProjectInput): Promise<Project> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user");
      }

      console.log("Creating project for user:", user.id);

      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: input.name,
          description: input.description || null,
          status: input.status,
          color: input.color,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating project:", error);
        throw error;
      }

      console.log("Project created:", data);

      // Add the creator as a member with admin role
      const { error: memberError } = await supabase
        .from("project_members")
        .insert({
          project_id: data.id,
          user_id: user.id,
          role: 'admin',
        });

      if (memberError) {
        console.error("Error adding creator as member:", memberError);
        // Don't throw here - the project was created successfully
      }

      return {
        ...data,
        members: [],
        taskCount: 0,
      };
    } catch (error) {
      console.error("Error in createProject:", error);
      throw error;
    }
  },

  async updateProject(input: UpdateProjectInput): Promise<Project> {
    try {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error in updateProject:", error);
      throw error;
    }
  },

  async deleteProject(id: string): Promise<void> {
    try {
      // First delete all project members
      const { error: membersError } = await supabase
        .from("project_members")
        .delete()
        .eq("project_id", id);

      if (membersError) {
        console.error("Error deleting project members:", membersError);
        // Continue with project deletion
      }

      // Then delete the project
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error in deleteProject:", error);
      throw error;
    }
  },

  async addProjectMember(projectId: string, userId: string, role: string = 'member'): Promise<void> {
    try {
      const { error } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: userId,
          role,
        });

      if (error) throw error;
    } catch (error) {
      console.error("Error in addProjectMember:", error);
      throw error;
    }
  },

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", userId);

      if (error) throw error;
    } catch (error) {
      console.error("Error in removeProjectMember:", error);
      throw error;
    }
  },

  async updateProjectMemberRole(projectId: string, userId: string, role: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("project_members")
        .update({ role })
        .eq("project_id", projectId)
        .eq("user_id", userId);

      if (error) throw error;
    } catch (error) {
      console.error("Error in updateProjectMemberRole:", error);
      throw error;
    }
  },


// services/projectService.ts - Updated getProjectMembers

async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  try {
    // First get the project members
    const { data: membersData, error: membersError } = await supabase
      .from("project_members")
      .select(`
        id,
        project_id,
        user_id,
        role,
        joined_at
      `)
      .eq("project_id", projectId)
      .order('joined_at', { ascending: true });

    if (membersError) throw membersError;

    if (!membersData || membersData.length === 0) {
      return [];
    }

    // Get user details from profiles for each member
    const userIds = membersData.map(m => m.user_id);
    
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, email, avatar_url")
      .in("id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      // Return members without user details if profiles fetch fails
      return membersData.map((member:any) => ({
        ...member,
        user: null
      }));
    }

    // Combine member data with user profiles
    const membersWithUsers = membersData.map((member:any) => {
      const userProfile = profilesData?.find(p => p.id === member.user_id);
      return {
        ...member,
        user: userProfile || null
      };
    });

    return membersWithUsers;
  } catch (error) {
    console.error("Error in getProjectMembers:", error);
    throw error;
  }
},
};


// React Query Hooks
export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.lists(),
    queryFn: projectService.getProjects,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id || ''),
    queryFn: () => projectService.getProject(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectService.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success("Project created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create project");
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectService.updateProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(data.id) });
      toast.success("Project updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update project");
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectService.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success("Project deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete project");
    },
  });
}

export function useAddProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, userId, role }: { projectId: string; userId: string; role?: string }) =>
      projectService.addProjectMember(projectId, userId, role),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
      toast.success("Member added successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add member");
    },
  });
}

export function useRemoveProjectMember(){
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, userId }: { projectId: string; userId: string; }) =>
      projectService.removeProjectMember(projectId, userId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
      toast.success("Member removed successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove member");
    },
  });
}

export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => projectService.getProjectMembers(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}