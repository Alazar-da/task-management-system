// app/projects/[projectId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProject } from "@/services/projectService";
import { useTasksByProject } from "@/services/taskService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  Plus, 
  Loader2,
  Settings,
  MoreVertical,
  Edit2,
  Trash2,
} from "lucide-react";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { CreateTaskForm } from "@/components/tasks/CreateTaskForm";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import { ProjectMembers } from "@/components/projects/ProjectMembers";

/* interface ProjectDetailPageProps {
  params: {
    projectId: string;
  };
} */

type ProjectStatus = 'Planning' | 'In Progress' | 'Completed' | 'On Hold';

const statusColors: Record<ProjectStatus, string> = {
  'Planning': 'bg-sky-500/15 text-sky-700 border-sky-200 hover:bg-sky-500/25 dark:text-sky-400 dark:border-sky-800',
  'In Progress': 'bg-amber-500/15 text-amber-700 border-amber-200 hover:bg-amber-500/25 dark:text-amber-400 dark:border-amber-800',
  'Completed': 'bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/25 dark:text-emerald-400 dark:border-emerald-800',
  'On Hold': 'bg-slate-500/15 text-slate-700 border-slate-200 hover:bg-slate-500/25 dark:text-slate-400 dark:border-slate-800',
};

export default function ProjectDetailPage(/* { params }: ProjectDetailPageProps */) {
  const router = useRouter();
 const params = useParams();
  const projectId = params?.projectId as string;
  console.log("Project ID:", projectId); // Debugging line
  
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: tasks, isLoading: tasksLoading } = useTasksByProject(projectId);
  
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("board");

    // Debug logging
  useEffect(() => {
    console.log("Project data:", project);
    console.log("Tasks data:", tasks);
  }, [project, tasks]);

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-semibold">Project not found</h2>
        <p className="text-gray-500 mt-2">The project you're looking for doesn't exist.</p>
        <Button className="mt-4" onClick={() => router.push("/projects")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const memberCount = project.members?.length || 0;

  return (
    <div className="container max-w-7xl py-8 px-4 mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/projects")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: project.color }}
              />
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge className={cn("font-medium", statusColors[project.status])}>
                {project.status}
              </Badge>
            </div>
            {project.description && (
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {project.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsCreateTaskOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
          <Button variant="outline" onClick={() => setIsEditFormOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Project Settings
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Tasks</p>
                <p className="text-2xl font-bold">{tasks?.length || 0}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold">
                  {tasks?.filter((t:any) => t.status === 'in_progress').length || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-full">
                <div className="w-5 h-5 rounded-full border-2 border-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold">
                  {tasks?.filter((t:any) => t.status === 'done').length || 0}
                </p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-full">
                <div className="w-5 h-5 rounded-full border-2 border-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Members</p>
                <p className="text-2xl font-bold">{memberCount}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Created</span>
              <p>{format(new Date(project.created_at), 'PPP')}</p>
            </div>
            <div>
              <span className="text-gray-500">Status</span>
              <p><Badge className={cn("font-medium", statusColors[project.status])}>
                {project.status}
              </Badge></p>
            </div>
            <div>
              <span className="text-gray-500">Members</span>
              <p>{memberCount} members</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
  <CardHeader>
    <CardTitle className="text-sm font-medium">Project Members</CardTitle>
  </CardHeader>
  <CardContent>
    <ProjectMembers projectId={projectId} />
  </CardContent>
</Card>

      {/* Tabs */}
 {/*      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="board">Kanban Board</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="board">
          <TaskBoard 
            tasks={tasks || []}
            isLoading={tasksLoading}
          />
        </TabsContent>

        <TabsContent value="list">
          {/* List view will be implemented later 
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">List view coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs> */}

      {/* Edit Project Form */}
      <ProjectForm
        open={isEditFormOpen}
        onOpenChange={setIsEditFormOpen}
        onSubmit={(data) => {
          // Handle update
          setIsEditFormOpen(false);
        }}
        initialData={project}
      />

      {/* Create Task Form */}
      <CreateTaskForm
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        projectId={projectId}
      />
    </div>
  );
}