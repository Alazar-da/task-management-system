// components/projects/ProjectCard.tsx
"use client";

import { Project } from "@/types/project";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Eye, 
  FolderOpen 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

const statusColors = {
  'Planning': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'In Progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  'Completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'On Hold': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

export function ProjectCard({ project, onEdit, onDelete, onView }: ProjectCardProps) {
  const memberCount = project.members?.length || 0;

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full shrink-0" 
              style={{ backgroundColor: project.color }}
            />
            <CardTitle className="text-lg line-clamp-1">
              {project.name}
            </CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(project.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(project.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="line-clamp-2">
          {project.description || "No description"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{memberCount} members</span>
          </div>
          <div className="flex items-center gap-1">
            <FolderOpen className="h-4 w-4" />
            <span>{project.taskCount || 0} tasks</span>
          </div>
        </div>
        <div className="mt-3">
          <Badge className={cn("font-medium", statusColors[project.status])}>
            {project.status}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="h-4 w-4" />
          <span>Created {format(new Date(project.created_at), 'MMM d, yyyy')}</span>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onView(project.id)}
        >
          View Project
        </Button>
      </CardFooter>
    </Card>
  );
}