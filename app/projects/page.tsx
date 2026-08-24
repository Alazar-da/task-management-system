// app/projects/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from "@/services/projectService";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Grid3x3,
  LayoutList,
  Loader2,
} from "lucide-react";
import { CreateProjectInput, Project, ProjectMember } from "@/types/project";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

type ViewMode = 'grid' | 'list';

export default function Projects() {
  const router = useRouter();
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  const handleCreateProject = (data: CreateProjectInput) => {
    createProject.mutate(data, {
      onSuccess: () => {
        setIsFormOpen(false);
      },
    });
  };

  const handleUpdateProject = (data: CreateProjectInput) => {
    if (!editingProject) return;
    updateProject.mutate(
      { id: editingProject.id, ...data },
      {
        onSuccess: () => {
          setEditingProject(null);
          setIsFormOpen(false);
        },
      }
    );
  };

  const handleDeleteProject = () => {
    if (!deletingProjectId) return;
    deleteProject.mutate(deletingProjectId, {
      onSuccess: () => {
        setDeletingProjectId(null);
      },
    });
  };

  const filteredProjects = projects?.filter((project) => {
    const matchesSearch = project.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8 px-4 mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage all your projects and their tasks
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingProject(null);
            setIsFormOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Planning">Planning</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="On Hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button  variant={viewMode === "grid" ? "default" : "ghost"} onClick={() => setViewMode("grid")}>
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "ghost"} onClick={() => setViewMode("list")}>
            <LayoutList className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Project Grid/List */}
      {filteredProjects && filteredProjects.length > 0 ? (
        <div className={cn(
          "grid gap-6",
          viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"


        )}>
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onView={(id) => router.push(`/projects/${id}`)}
              onEdit={(project) => {
                setEditingProject(project);
                setIsFormOpen(true);
              }}
              onDelete={(id) => setDeletingProjectId(id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            {searchQuery || statusFilter !== "all" 
              ? "No projects match your filters" 
              : "No projects yet. Create your first project!"}
          </div>
        </div>
      )}

      {/* Project Form Modal */}
      <ProjectForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
        initialData={editingProject}
        isLoading={createProject.isPending || updateProject.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!deletingProjectId} 
        onOpenChange={() => setDeletingProjectId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              and all its associated tasks and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProject}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}