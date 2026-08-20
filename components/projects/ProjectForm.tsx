// components/projects/ProjectForm.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Project, CreateProjectInput } from "@/types/project";
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
import { cn } from "@/lib/utils";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Project name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  status: z.enum(['Planning', 'In Progress', 'Completed', 'On Hold']),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, "Invalid color format"),
});

type ProjectFormData = z.infer<typeof projectSchema>;

const statusOptions = [
  'Planning', 'In Progress', 'Completed', 'On Hold'
] as const;

const presetColors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateProjectInput) => void;
  initialData?: Project | null;
  isLoading?: boolean;
}

export function ProjectForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: ProjectFormProps) {
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "Planning",
      color: "#3B82F6",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        description: initialData.description || "",
        status: initialData.status,
        color: initialData.color,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        status: "Planning",
        color: "#3B82F6",
      });
    }
  }, [initialData, form]);

  const handleSubmit = (data: ProjectFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Project' : 'Create New Project'}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? 'Update your project details and settings.' 
              : 'Fill in the details to create a new project.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FieldGroup>
            {/* Project Name */}
            <Field>
              <FieldLabel htmlFor="name">Project Name</FieldLabel>
              <Input
                id="name"
                placeholder="Enter project name"
                {...form.register("name")}
                className={cn(
                  form.formState.errors.name && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </Field>

            {/* Description */}
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                placeholder="Describe your project..."
                className="resize-none h-24"
                {...form.register("description")}
              />
              <FieldDescription>
                Brief description of what this project is about.
              </FieldDescription>
            </Field>

            {/* Status */}
            <Field>
              <FieldLabel htmlFor="status">Status</FieldLabel>
              <Select 
                onValueChange={(value) => form.setValue("status", value as any)} 
                defaultValue={form.watch("status")}
              >
                <SelectTrigger 
                  id="status"
                  className={cn(
                    form.formState.errors.status && "border-red-500 focus-visible:ring-red-500"
                  )}
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.status && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.status.message}
                </p>
              )}
            </Field>

            {/* Color Picker */}
            <Field>
              <FieldLabel>Project Color</FieldLabel>
              <div className="flex flex-wrap gap-3">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "w-10 h-10 rounded-full border-2 transition-all",
                      form.watch("color") === color 
                        ? "border-primary scale-110" 
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => form.setValue("color", color)}
                  />
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    className="w-10 h-10 p-0 border rounded-full overflow-hidden cursor-pointer"
                    {...form.register("color")}
                  />
                </div>
              </div>
              {form.formState.errors.color && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.color.message}
                </p>
              )}
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : initialData ? "Update Project" : "Create Project"}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}