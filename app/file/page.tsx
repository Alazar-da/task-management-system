// app/file/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  File,
  Folder,
  Download,
  Trash2,
  Loader2,
  Search,
  Filter,
  X,
  Calendar,
  User,
  FileText,
  Image,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  Plus,
  Upload,
  ExternalLink,
  Grid3x3,
  LayoutList,
  ChevronDown,
} from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "react-hot-toast";

const supabase = createClient();

interface FileItem {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  created_at: string;
  task?: {
    id: string;
    title: string;
    project?: {
      id: string;
      name: string;
      color: string;
    };
  };
  uploader?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

const fileTypeIcons: Record<string, any> = {
  'image': <Image className="h-8 w-8" />,
  'pdf': <FileText className="h-8 w-8 text-red-500" />,
  'video': <FileVideo className="h-8 w-8 text-purple-500" />,
  'audio': <FileAudio className="h-8 w-8 text-yellow-500" />,
  'zip': <FileArchive className="h-8 w-8 text-orange-500" />,
  'code': <FileCode className="h-8 w-8 text-blue-500" />,
  'spreadsheet': <FileSpreadsheet className="h-8 w-8 text-green-500" />,
  'document': <FileText className="h-8 w-8 text-blue-500" />,
  'default': <File className="h-8 w-8 text-gray-400" />,
};

const fileTypeColors: Record<string, string> = {
  'image': 'bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800',
  'pdf': 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
  'video': 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800',
  'audio': 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800',
  'zip': 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
  'code': 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
  'spreadsheet': 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
  'document': 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
  'default': 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800',
};

export default function FilePage() {
  const router = useRouter();
  const { user } = useUser();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTaskId, setUploadTaskId] = useState<string>("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch files from database
  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      
      // Get all task attachments
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from("task_attachments")
        .select(`
          *,
          task:tasks (
            id,
            title,
            project:projects (
              id,
              name,
              color
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (attachmentsError) throw attachmentsError;

      // Get uploader details from profiles
      const uploaderIds = attachmentsData?.map(a => a.uploaded_by).filter(id => id !== null) || [];
      let uploaderMap = new Map();

      if (uploaderIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", uploaderIds);

        if (!profilesError) {
          profilesData?.forEach(profile => {
            uploaderMap.set(profile.id, profile);
          });
        }
      }

      // Combine data
      const filesWithDetails = attachmentsData?.map(attachment => ({
        ...attachment,
        uploader: attachment.uploaded_by ? uploaderMap.get(attachment.uploaded_by) : null,
      })) || [];

      setFiles(filesWithDetails);
      setFilteredFiles(filesWithDetails);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Failed to load files");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tasks for upload dialog
  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, project_id")
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchTasks();
  }, []);

  // Filter files
  useEffect(() => {
    let filtered = files;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(file => 
        file.file_name.toLowerCase().includes(query) ||
        file.task?.title?.toLowerCase().includes(query)
      );
    }

    setFilteredFiles(filtered);
  }, [searchQuery, files]);

  const getFileIcon = (fileType: string) => {
    return fileTypeIcons[fileType] || fileTypeIcons.default;
  };

  const getFileColor = (fileType: string) => {
    return fileTypeColors[fileType] || fileTypeColors.default;
  };

  const getFileTypeLabel = (fileType: string) => {
    if (!fileType) return 'Unknown';
    return fileType.charAt(0).toUpperCase() + fileType.slice(1);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const handleDownload = async (file: FileItem) => {
    try {
      // If it's a public URL, open it directly
      if (file.file_url) {
        window.open(file.file_url, '_blank');
        toast.success("Opening file...");
        return;
      }

      // If it's a private URL, generate a signed URL
      const filePath = file.file_url.split('/').pop();
      if (filePath) {
        const { data, error } = await supabase.storage
          .from('task-attachments')
          .createSignedUrl(filePath, 60); // 60 seconds expiry

        if (error) throw error;
        
        if (data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
          toast.success("Opening file...");
        }
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const handleDelete = async (file: FileItem) => {
    setSelectedFile(file);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedFile) return;

    try {
      // Delete from storage
      const filePath = selectedFile.file_url.split('/').pop();
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('task-attachments')
          .remove([filePath]);

        if (storageError) {
          console.error("Storage delete error:", storageError);
          // Continue with database deletion even if storage fails
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("task_attachments")
        .delete()
        .eq("id", selectedFile.id);

      if (dbError) throw dbError;

      // Update local state
      setFiles(files.filter(f => f.id !== selectedFile.id));
      setIsDeleteDialogOpen(false);
      setSelectedFile(null);
      toast.success("File deleted successfully");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadTaskId) {
      toast.error("Please select a task and file");
      return;
    }

    try {
      setIsUploading(true);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        toast.error("You must be logged in to upload");
        return;
      }

      // Upload to storage
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(fileName, uploadFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: uploadFile.type,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from("task_attachments")
        .insert({
          task_id: uploadTaskId,
          file_name: uploadFile.name,
          file_url: publicUrl,
          file_size: uploadFile.size,
          file_type: uploadFile.type.split('/')[0] || 'default',
          uploaded_by: currentUser.id,
        });

      if (dbError) throw dbError;

      // Refresh files
      await fetchFiles();
      
      setIsUploadDialogOpen(false);
      setUploadFile(null);
      setUploadTaskId("");
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const getTotalSize = () => {
    return files.reduce((acc, f) => acc + (f.file_size || 0), 0);
  };

  const getUniqueFileTypes = () => {
    return new Set(files.map(f => f.file_type).filter(Boolean)).size;
  };

  const getLargestFile = () => {
    if (files.length === 0) return 0;
    return Math.max(...files.map(f => f.file_size || 0));
  };

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Files</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage all your task attachments and files
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Files</p>
                <p className="text-2xl font-bold">{files.length}</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-full">
                <File className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Size</p>
                <p className="text-2xl font-bold">
                  {formatFileSize(getTotalSize())}
                </p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-full">
                <Download className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">File Types</p>
                <p className="text-2xl font-bold">{getUniqueFileTypes()}</p>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-full">
                <Folder className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Largest File</p>
                <p className="text-sm font-medium truncate">
                  {files.length > 0 ? formatFileSize(getLargestFile()) : 'N/A'}
                </p>
              </div>
              <div className="p-2 bg-orange-500/10 rounded-full">
                <FileText className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and View */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <ToggleGroup type="single" value={viewMode} onValueChange={(v:any) => v && setViewMode(v as 'grid' | 'list')}>
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <Grid3x3 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <LayoutList className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Files Grid/List */}
      {filteredFiles.length > 0 ? (
        <div className={cn(
          "gap-4",
          viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : "space-y-3"
        )}>
          {filteredFiles.map((file) => (
            <Card 
              key={file.id}
              className={cn(
                "hover:shadow-lg transition-all duration-200",
                viewMode === 'grid' ? "hover:scale-[1.02]" : ""
              )}
            >
              <CardContent className={cn(
                viewMode === 'grid' ? "p-4 text-center" : "p-4 flex items-center gap-4"
              )}>
                {/* File Icon */}
                <div className={cn(
                  getFileColor(file.file_type || 'default'),
                  "rounded-lg p-3 inline-flex items-center justify-center",
                  viewMode === 'grid' ? "mx-auto mb-3" : "flex-shrink-0"
                )}>
                  {getFileIcon(file.file_type || 'default')}
                </div>

                {/* File Info */}
                <div className={cn(
                  "flex-1 min-w-0",
                  viewMode === 'grid' ? "text-center" : "text-left"
                )}>
                  <p className="font-medium text-sm truncate" title={file.file_name}>
                    {file.file_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
                    <Badge variant="outline" className="text-[10px]">
                      {getFileTypeLabel(file.file_type || 'default')}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {formatFileSize(file.file_size || 0)}
                    </span>
                  </div>
                  {viewMode === 'list' && file.task && (
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: file.task?.project?.color || '#3B82F6' }}
                      />
                      <span className="text-xs text-gray-500 truncate">
                        {file.task.title}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 flex-wrap justify-center">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}</span>
                    {file.uploader && (
                      <>
                        <span>•</span>
                        <User className="h-3 w-3" />
                        <span className="truncate max-w-[80px]">{file.uploader.username}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className={cn(
                  "flex items-center gap-1",
                  viewMode === 'grid' ? "justify-center mt-3" : "flex-shrink-0"
                )}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDownload(file)}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(file)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <File className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-600">No files found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? 'Try adjusting your search' : 'Upload files to get started'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the file
              "{selectedFile?.file_name}" from the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              Upload a file and attach it to a task.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Select Task</label>
              <Select value={uploadTaskId} onValueChange={setUploadTaskId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Choose File</label>
              <div className="mt-1">
                <label className="cursor-pointer block">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {uploadFile ? uploadFile.name : 'Click to select file'}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">Max size: 5MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("File size must be less than 5MB");
                          return;
                        }
                        setUploadFile(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsUploadDialogOpen(false);
              setUploadFile(null);
              setUploadTaskId("");
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!uploadFile || !uploadTaskId || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}