// app/tasks/[taskId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useTask, useUpdateTask, useDeleteTask, useAddComment, useAddSubtask, useUpdateSubtask, useDeleteSubtask, useUploadAttachment, useDeleteAttachment } from "@/services/taskService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Calendar,
  Paperclip,
  Send,
  Plus,
  Check,
  X,
  Trash2,
  Edit2,
  Clock,
  User,
  FileText,
  Download,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

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

const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;
  
  const { data: task, isLoading, error, refetch } = useTask(taskId);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const addComment = useAddComment();
  const addSubtask = useAddSubtask();
  const updateSubtask = useUpdateSubtask();
  const deleteSubtask = useDeleteSubtask();
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();

  const [isEditing, setIsEditing] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeletingSubtask, setIsDeletingSubtask] = useState<string | null>(null);
  const [isDeletingAttachment, setIsDeletingAttachment] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
  });

  // Initialize editing task when task loads
  useEffect(() => {
    if (task) {
      setEditingTask({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        status: task.status,
      });
    }
  }, [task]);

   const handleDeleteAttachment = async (attachmentId:any) => {
    try {
      await deleteAttachment.mutateAsync(attachmentId);
      setIsDeletingAttachment(null);
      refetch();
      toast.success("Attachment deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete attachment");
    }
  };

  const handleDownloadAttachment = async (attachment: any) => {
    try {
      // Fetch the file from the URL
      const response = await fetch(attachment.file_url);
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Downloading...");
    } catch (error) {
      // If direct download fails, open in new tab
      window.open(attachment.file_url, '_blank');
      toast.success("Opening file...");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-red-500">Error loading task: {error?.message}</p>
        <Button onClick={() => refetch()} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleUpdateTask = async () => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority as any,
        status: editingTask.status as any,
      });
      setIsEditing(false);
      refetch();
      toast.success("Task updated successfully!");
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await addComment.mutateAsync({
        taskId: task.id,
        content: newComment,
      });
      setNewComment("");
      refetch();
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    try {
      await addSubtask.mutateAsync({
        taskId: task.id,
        title: newSubtask,
      });
      setNewSubtask("");
      refetch();
    } catch (error) {
      toast.error("Failed to add subtask");
    }
  };

  const handleToggleSubtask = async (subtask: any) => {
    try {
      await updateSubtask.mutateAsync({
        id: subtask.id,
        updates: { is_completed: !subtask.is_completed },
      });
      refetch();
    } catch (error) {
      toast.error("Failed to update subtask");
    }
  };

  const handleDeleteSubtask = async (id: string) => {
    try {
      await deleteSubtask.mutateAsync(id);
      setIsDeletingSubtask(null);
      refetch();
      toast.success("Subtask deleted!");
    } catch (error) {
      toast.error("Failed to delete subtask");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    try {
      await uploadAttachment.mutateAsync({
        taskId: task.id,
        file,
      });
      refetch();
      toast.success("File uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload file");
    }
    
    // Reset input
    e.target.value = '';
  };

  const handleDeleteTask = async () => {
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success("Task deleted successfully!");
      router.push('/tasks');
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  return (
    <div className="container max-w-5xl py-8 px-4 mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <Badge className={cn("font-medium", statusColors[task.status])}>
              {task.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge className={cn("font-medium", priorityColors[task.priority])}>
              {task.priority.toUpperCase()}
            </Badge>
            {task.project && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.project.color }} />
                {task.project.name}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Description</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={editingTask.title}
                      onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                      placeholder="Title"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={editingTask.description}
                      onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                      placeholder="Description"
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Select
                        value={editingTask.status}
                        onValueChange={(value:any) => setEditingTask({ ...editingTask, status: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Priority</label>
                      <Select
                        value={editingTask.priority}
                        onValueChange={(value:any) => setEditingTask({ ...editingTask, priority: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateTask} disabled={updateTask.isPending}>
                      {updateTask.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsEditing(false);
                      setEditingTask({
                        title: task.title,
                        description: task.description || "",
                        priority: task.priority,
                        status: task.status,
                      });
                    }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                    {task.description || "No description provided."}
                  </p>
                  <div className="mt-4 text-sm text-gray-500">
                    <span className="font-medium">Status:</span> {task.status.replace('_', ' ').toUpperCase()}
                    <span className="mx-2">•</span>
                    <span className="font-medium">Priority:</span> {task.priority.toUpperCase()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subtasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Subtasks</CardTitle>
              <span className="text-xs text-gray-500">
                {task.subtasks?.filter(s => s.is_completed).length || 0}/{task.subtasks?.length || 0} completed
              </span>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {task.subtasks && task.subtasks.length > 0 ? (
                  task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg group">
                      <button
                        onClick={() => handleToggleSubtask(subtask)}
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                          subtask.is_completed
                            ? "bg-primary border-primary text-white"
                            : "border-gray-300 hover:border-primary"
                        )}
                      >
                        {subtask.is_completed && <Check className="h-3 w-3" />}
                      </button>
                      <span className={cn(
                        "flex-1 text-sm",
                        subtask.is_completed && "line-through text-gray-400"
                      )}>
                        {subtask.title}
                      </span>
                      <button
                        onClick={() => setIsDeletingSubtask(subtask.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No subtasks yet</p>
                )}
                <div className="flex gap-2 mt-4">
                  <Input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="Add subtask..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleAddSubtask}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {task.comments && task.comments.length > 0 ? (
                  task.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(comment.user?.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {comment.user?.username || "Unknown"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No comments yet</p>
                )}
                <div className="flex gap-2 mt-4">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleAddComment}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-gray-500">Assignee</span>
                <div className="flex items-center gap-2 mt-1">
                  {task.assignee ? (
                    <>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={task.assignee.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(task.assignee.username)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.assignee.username}</span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">Unassigned</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Due Date</span>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {task.due_date ? format(new Date(task.due_date), 'PPP') : "No due date"}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Created</span>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {format(new Date(task.created_at), 'PPP')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
         <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Attachments</CardTitle>
          <span className="text-xs text-gray-500">
            {task.attachments?.length || 0} files
          </span>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {task.attachments && task.attachments.length > 0 ? (
              task.attachments.map((attachment) => (
                <div 
                  key={attachment.id} 
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg group"
                >
                  <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" title={attachment.file_name}>
                      {attachment.file_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {(attachment.file_size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownloadAttachment(attachment)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => setIsDeletingAttachment(attachment.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No attachments</p>
            )}
            
            {/* Upload Area */}
            <div className="mt-4">
              <label className="cursor-pointer block">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center hover:border-primary transition-colors">
                  <Paperclip className="h-5 w-5 mx-auto mb-2 text-gray-400" />
                  <span className="text-sm text-gray-500">Click to upload file</span>
                  <p className="text-xs text-gray-400 mt-1">Max size: 5MB</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Attachment Confirmation Dialog */}
      <AlertDialog 
        open={!!isDeletingAttachment} 
        onOpenChange={() => setIsDeletingAttachment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the attachment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (isDeletingAttachment) {
                  handleDeleteAttachment(isDeletingAttachment);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Attachment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {task.activity_logs && task.activity_logs.length > 0 ? (
                  task.activity_logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2 text-sm">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(log.user?.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium">{log.user?.username || 'System'}</span>
                        <span className="text-gray-500">
                          {" "}{log.action.replace(/_/g, ' ')}
                        </span>
                        <div className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No activity yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Task Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task
              "{task.title}" and all its associated data including subtasks, comments, and attachments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTask}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Subtask Confirmation Dialog */}
      <AlertDialog 
        open={!!isDeletingSubtask} 
        onOpenChange={() => setIsDeletingSubtask(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subtask?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the subtask.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (isDeletingSubtask) {
                  handleDeleteSubtask(isDeletingSubtask);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Subtask
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}