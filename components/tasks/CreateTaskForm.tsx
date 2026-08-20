// components/tasks/CreateTaskForm.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCreateTask } from "@/services/taskService";
import { useProjectMembers } from "@/services/projectService";
import { ProjectMember } from "@/types/project";
import { cn } from "@/lib/utils";

const taskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200, "Title is too long"),
  description: z.string().max(1000, "Description is too long").optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assignee_id: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface CreateTaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onTaskCreated?: () => void;
}

export function CreateTaskForm({ 
  open, 
  onOpenChange, 
  projectId,
  onTaskCreated 
}: CreateTaskFormProps) {
  const createTask = useCreateTask();
  const { data: members, isLoading: membersLoading } = useProjectMembers(projectId);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      assignee_id: null,
      due_date: null,
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  // Get the selected member's username for display
  const selectedMember = members?.find(
    (member) => member.user_id === form.watch("assignee_id")
  );
  const selectedUsername = selectedMember?.user?.username || "";

  const handleSubmit = (data: TaskFormData) => {
    createTask.mutate(
      {
        ...data,
        project_id: projectId,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          if (onTaskCreated) {
            onTaskCreated();
          }
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to this project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FieldGroup>
            {/* Title */}
            <Field>
              <FieldLabel htmlFor="title">Task Title</FieldLabel>
              <Input
                id="title"
                placeholder="Enter task title"
                {...form.register("title")}
                className={cn(
                  form.formState.errors.title && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </Field>

            {/* Description */}
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                placeholder="Describe the task..."
                className="resize-none h-24"
                {...form.register("description")}
              />
              <FieldDescription>
                Detailed description of what needs to be done.
              </FieldDescription>
            </Field>

            {/* Priority */}
            <Field>
              <FieldLabel>Priority</FieldLabel>
              <Select
                onValueChange={(value) => form.setValue("priority", value as any)}
                defaultValue="medium"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* Assignee - Only Project Members */}
            <Field>
              <FieldLabel>Assignee</FieldLabel>
              <Select
                value={form.watch("assignee_id") || ""}
                onValueChange={(value) => form.setValue("assignee_id", value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign to...">
                    {selectedUsername || "Assign to..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {membersLoading ? (
                    <SelectItem value="loading" disabled>Loading members...</SelectItem>
                  ) : members && members.length > 0 ? (
                    members.map((member: ProjectMember) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        <div className="flex items-center gap-2">
                          {member.user?.avatar_url ? (
                            <img 
                              src={member.user.avatar_url} 
                              alt={member.user.username} 
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                              {member.user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <span>{member.user?.username || 'Unknown'}</span>
                          <span className="text-xs text-gray-400 ml-auto">
                            {member.role}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-members" disabled>
                      No members in this project
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FieldDescription>
                Select a project member to assign this task to.
              </FieldDescription>
            </Field>

            {/* Due Date */}
            <Field>
              <FieldLabel htmlFor="due_date">Due Date</FieldLabel>
              <Input
                id="due_date"
                type="date"
                {...form.register("due_date")}
                min={new Date().toISOString().split('T')[0]}
              />
              <FieldDescription>
                When is this task due?
              </FieldDescription>
            </Field>

            <FieldSeparator />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createTask.isPending}>
                {createTask.isPending ? "Creating..." : "Create Task"}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}