// components/tasks/TaskList.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Task } from "@/types/task";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
  ArrowUpDown,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useDeleteTask } from "@/services/taskService";

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const statusColors = {
  todo: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  review: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  done: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

export function TaskList({ tasks, isLoading }: TaskListProps) {
  const router = useRouter();
  const deleteTask = useDeleteTask();
  const [sortField, setSortField] = useState<keyof Task>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSort = (field: keyof Task) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortDirection === 'asc' 
      ? (aValue as any) - (bValue as any)
      : (bValue as any) - (aValue as any);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse space-y-4 w-full">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No tasks found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">
              <Button variant="ghost" onClick={() => handleSort('title')} className="p-0 h-auto font-semibold">
                Title
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('status')} className="p-0 h-auto font-semibold">
                Status
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('priority')} className="p-0 h-auto font-semibold">
                Priority
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('due_date')} className="p-0 h-auto font-semibold">
                Due Date
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.map((task) => {
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
            
            return (
              <TableRow 
                key={task.id}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                onClick={() => router.push(`/tasks/${task.id}`)}
              >
                <TableCell className="font-medium">
                  <div>
                    <div className="line-clamp-1">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-gray-500 line-clamp-1">
                        {task.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn("font-medium", statusColors[task.status])}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={cn("font-medium", priorityColors[task.priority])}>
                    {task.priority.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  {task.project && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.project.color }} />
                      <span className="text-sm">{task.project.name}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={task.assignee.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(task.assignee.username)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.assignee.username}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  {task.due_date ? (
                    <div className={cn(
                      "flex items-center gap-1 text-sm",
                      isOverdue && "text-red-500 font-medium"
                    )}>
                      <Calendar className="h-3 w-3" />
                      {format(new Date(task.due_date), 'MMM d, yyyy')}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No date</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/tasks/${task.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/tasks/${task.id}/edit`)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this task?')) {
                            deleteTask.mutate(task.id);
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}