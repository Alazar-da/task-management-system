// components/tasks/TaskBoard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Task } from "@/types/task";
import { TaskCard } from "@/components/tasks/TaskCard";
import { useUpdateTaskStatus, } from "@/services/taskService";
import { cn } from "@/lib/utils";

interface TaskBoardProps {
  tasks: Task[];
  isLoading?: boolean;
}

const columns = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100 dark:bg-gray-800' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50 dark:bg-blue-950/30' },
  { id: 'review', title: 'Review', color: 'bg-purple-50 dark:bg-purple-950/30' },
  { id: 'done', title: 'Done', color: 'bg-green-50 dark:bg-green-950/30' },
];

export function TaskBoard({ tasks, isLoading }: TaskBoardProps) {
  const router = useRouter();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const updateTaskStatus = useUpdateTaskStatus();

  const getTasksByStatus = (status: string) => {
    return tasks?.filter(task => task.status === status) || [];
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (status: string) => {
    if (!draggedTask) return;
    
    if (draggedTask.status !== status) {
      await updateTaskStatus.mutateAsync({
        id: draggedTask.id,
        status,
      });
    }
    setDraggedTask(null);
  };

  const handleTaskClick = (taskId: string) => {
    router.push(`/tasks/${taskId}`);
  };



  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex space-x-4 w-full">
          {columns.map((col) => (
            <div key={col.id} className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No tasks found. Create your first task!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.id);
        
        return (
          <div
            key={column.id}
            className={cn(
              "rounded-lg p-4 min-h-[400px]",
              column.color
            )}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">
                {column.title}
              </h3>
              <span className="text-sm text-gray-500">
                {columnTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDragStart={() => handleDragStart(task)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleTaskClick(task.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}