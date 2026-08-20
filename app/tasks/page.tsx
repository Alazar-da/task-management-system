// app/tasks/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTasks } from "@/services/taskService";
import { useProjects } from "@/services/projectService";
import { useUsers } from "@/hooks/use-users";
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
  RefreshCw,
  Filter,
  X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskList } from "@/components/tasks/TaskList";
import { CreateTaskForm } from "@/components/tasks/CreateTaskForm";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function TasksPage() {
  const router = useRouter();
  const { data: allTasks, isLoading, error, refetch } = useTasks();
  const { data: projects } = useProjects();
  const { data: users } = useUsers();

  const [view, setView] = useState<"board" | "list">("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    project: "all",
    priority: "all",
    assignee: "all",
    status: "all",
  });
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Apply filters
  const filteredTasks = allTasks?.filter((task) => {
    // Search filter
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Project filter
    const matchesProject = filters.project === "all" || task.project_id === filters.project;

    // Priority filter
    const matchesPriority = filters.priority === "all" || task.priority === filters.priority;

    // Assignee filter
    const matchesAssignee = filters.assignee === "all" || 
      (filters.assignee === "unassigned" && !task.assignee_id) ||
      task.assignee_id === filters.assignee;

    // Status filter
    const matchesStatus = filters.status === "all" || task.status === filters.status;

    return matchesSearch && matchesProject && matchesPriority && matchesAssignee && matchesStatus;
  }) || [];

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      project: "all",
      priority: "all",
      assignee: "all",
      status: "all",
    });
    setSearchQuery("");
  };

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(v => v !== "all").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-red-500">Error loading tasks: {error.message}</p>
        <Button onClick={() => refetch()} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8 px-4 mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage all your tasks across projects
          </p>
        </div>
     {/*    <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => refetch()}
            title="Refresh tasks"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setIsCreateTaskOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div> */}
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            <div className="border rounded-lg p-1 flex">
              <Button
                variant={view === "board" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("board")}
                className="gap-2"
              >
                <Grid3x3 className="h-4 w-4" />
                Board
              </Button>
              <Button
                variant={view === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("list")}
                className="gap-2"
              >
                <LayoutList className="h-4 w-4" />
                List
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <Select
              value={filters.project}
              onValueChange={(value) => setFilters({ ...filters, project: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.priority}
              onValueChange={(value) => setFilters({ ...filters, priority: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.assignee}
              onValueChange={(value) => setFilters({ ...filters, assignee: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="col-span-full lg:col-span-1"
              >
                <X className="h-4 w-4 mr-2" />
                Clear all filters
              </Button>
            )}
          </div>
        )}

        {/* Results count */}
        <div className="text-sm text-gray-500">
          Showing {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Task Views */}
      <Tabs value={view} onValueChange={(v) => setView(v as "board" | "list")} className="space-y-4">
        <TabsContent value="board" className="mt-0">
          <TaskBoard 
            tasks={filteredTasks}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          <TaskList 
            tasks={filteredTasks}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

    </div>
  );
}