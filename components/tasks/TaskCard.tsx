// components/tasks/TaskCard.tsx
"use client";

import { Task } from "@/types/task";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, User, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onClick?: () => void;
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const priorityIcons = {
  low: <AlertCircle className="h-3 w-3" />,
  medium: <AlertCircle className="h-3 w-3" />,
  high: <AlertCircle className="h-3 w-3" />,
  urgent: <AlertCircle className="h-3 w-3" />,
};

export function TaskCard({ task, onDragStart, onDragEnd, onClick }: TaskCardProps) {
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "cursor-grab hover:shadow-md transition-shadow duration-200",
        "active:cursor-grabbing"
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <h4 className="font-medium text-sm line-clamp-2">
          {task.title}
        </h4>

        {/* Priority & Due Date */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn("text-xs", priorityColors[task.priority])}>
            {task.priority}
          </Badge>
          {task.due_date && (
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                isOverdue && "border-red-500 text-red-500"
              )}
            >
              <Calendar className="h-3 w-3 mr-1" />
              {format(new Date(task.due_date), 'MMM d')}
            </Badge>
          )}
        </div>

        {/* Assignee */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            {task.assignee ? (
              <>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={task.assignee.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(task.assignee.username)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-500 line-clamp-1">
                  {task.assignee.username}
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-400">Unassigned</span>
            )}
          </div>
          
          {task.subtasks && task.subtasks.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {task.subtasks.filter(s => s.is_completed).length}/{task.subtasks.length}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}