// app/activity/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTasks } from "@/services/taskService";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  MessageSquare,
  Paperclip,
  FolderKanban,
  Filter,
  X,
  Search,
} from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface ActivityItem {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  task?: {
    id: string;
    title: string;
    status: string;
    project?: {
      id: string;
      name: string;
      color: string;
    };
  };
}

const actionColors = {
  created: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  updated: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  status_changed: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  comment_added: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  member_added: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  attachment_added: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  subtask_added: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  attachment_deleted: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const actionIcons = {
  created: <CheckCircle2 className="h-4 w-4" />,
  updated: <Activity className="h-4 w-4" />,
  status_changed: <Clock className="h-4 w-4" />,
  comment_added: <MessageSquare className="h-4 w-4" />,
  member_added: <User className="h-4 w-4" />,
  attachment_added: <Paperclip className="h-4 w-4" />,
  subtask_added: <FolderKanban className="h-4 w-4" />,
  attachment_deleted: <X className="h-4 w-4" />,
};

export default function ActivityPage() {
  const router = useRouter();
  const { user } = useUser();
  const { data: allTasks, isLoading: tasksLoading } = useTasks();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");

  // Generate mock activities from tasks
  useEffect(() => {
    if (allTasks) {
      const mockActivities: ActivityItem[] = [];
      
      allTasks.forEach(task => {
        // Task created activity
        mockActivities.push({
          id: `${task.id}-created`,
          task_id: task.id,
          user_id: task.created_by || '',
          action: 'created',
          details: { title: task.title },
          created_at: task.created_at,
          user: task.assignee || undefined,
          task: {
            id: task.id,
            title: task.title,
            status: task.status,
            project: task.project,
          },
        });

        // If task has been updated
        if (task.updated_at && task.updated_at !== task.created_at) {
          mockActivities.push({
            id: `${task.id}-updated`,
            task_id: task.id,
            user_id: task.created_by || '',
            action: 'updated',
            details: { changes: { status: { from: 'todo', to: task.status } } },
            created_at: task.updated_at,
            user: task.assignee || undefined,
            task: {
              id: task.id,
              title: task.title,
              status: task.status,
              project: task.project,
            },
          });
        }

        // If task has status changed (mock)
        if (task.status !== 'todo') {
          mockActivities.push({
            id: `${task.id}-status-${task.status}`,
            task_id: task.id,
            user_id: task.created_by || '',
            action: 'status_changed',
            details: { status: task.status },
            created_at: new Date(new Date(task.created_at).getTime() + 3600000).toISOString(),
            user: task.assignee || undefined,
            task: {
              id: task.id,
              title: task.title,
              status: task.status,
              project: task.project,
            },
          });
        }
      });

      // Sort by date descending
      mockActivities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setActivities(mockActivities);
      setFilteredActivities(mockActivities);
      setIsLoading(false);
    }
  }, [allTasks]);

  // Filter activities
  useEffect(() => {
    let filtered = activities;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.task?.title?.toLowerCase().includes(query) ||
        activity.action.toLowerCase().includes(query) ||
        activity.user?.username?.toLowerCase().includes(query)
      );
    }

    // Action filter
    if (filterAction !== 'all') {
      filtered = filtered.filter(activity => activity.action === filterAction);
    }

    setFilteredActivities(filtered);
  }, [searchQuery, filterAction, activities]);

  const getActionLabel = (action: string) => {
    return action.replace(/_/g, ' ').toUpperCase();
  };

  const getActionColor = (action: string) => {
    return actionColors[action as keyof typeof actionColors] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  };

  const getActionIcon = (action: string) => {
    return actionIcons[action as keyof typeof actionIcons] || <Activity className="h-4 w-4" />;
  };

  const getActivityMessage = (activity: ActivityItem) => {
    const userName = activity.user?.username || 'Someone';
    const taskTitle = activity.task?.title || 'a task';
    
    switch (activity.action) {
      case 'created':
        return `${userName} created "${taskTitle}"`;
      case 'updated':
        return `${userName} updated "${taskTitle}"`;
      case 'status_changed':
        const status = activity.details?.status || '';
        return `${userName} changed status of "${taskTitle}" to ${status.replace('_', ' ').toUpperCase()}`;
      case 'comment_added':
        return `${userName} commented on "${taskTitle}"`;
      case 'member_added':
        return `${userName} added a member to "${taskTitle}"`;
      case 'attachment_added':
        return `${userName} added an attachment to "${taskTitle}"`;
      case 'attachment_deleted':
        return `${userName} deleted an attachment from "${taskTitle}"`;
      case 'subtask_added':
        return `${userName} added a subtask to "${taskTitle}"`;
      default:
        return `${userName} ${activity.action} "${taskTitle}"`;
    }
  };

  if (isLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const uniqueActions = [...new Set(activities.map(a => a.action))];

  return (
    <div className="container max-w-7xl py-8 px-4 mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Feed</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track all activity across your tasks and projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => {
            setSearchQuery("");
            setFilterAction("all");
          }}>
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterAction}   onValueChange={(value) => setFilterAction(value ?? "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map((action) => (
              <SelectItem key={action} value={action}>
                {action.replace(/_/g, ' ').toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Activity Feed */}
      <div className="space-y-4">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity, index) => {
            const isFirst = index === 0;
            const isSameDay = index > 0 && 
              format(new Date(activity.created_at), 'yyyy-MM-dd') === 
              format(new Date(filteredActivities[index - 1].created_at), 'yyyy-MM-dd');

            return (
              <div key={activity.id}>
                {/* Date divider */}
                {!isSameDay && (
                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                    <span className="text-sm text-gray-500 font-medium">
                      {format(new Date(activity.created_at), 'EEEE, MMMM d, yyyy')}
                    </span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                  </div>
                )}

                {/* Activity item */}
                <Card className={cn(
                  "transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",
                  isFirst && "border-primary/20"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={activity.user?.avatar_url || undefined} />
                        <AvatarFallback className="text-sm">
                          {activity.user?.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        {/* Action badge and time */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={cn("text-xs", getActionColor(activity.action))}>
                            <span className="flex items-center gap-1">
                              {getActionIcon(activity.action)}
                              {getActionLabel(activity.action)}
                            </span>
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                          </span>
                        </div>

                        {/* Activity message */}
                        <p className="text-sm mt-1">
                          {getActivityMessage(activity)}
                        </p>

                        {/* Task link */}
                        {activity.task && (
                          <button
                            onClick={() => router.push(`/tasks/${activity.task_id}`)}
                            className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <FolderKanban className="h-3 w-3" />
                            View Task
                          </button>
                        )}

                        {/* Additional details */}
                        {activity.details?.changes && (
                          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md text-xs">
                            <span className="text-gray-500">Changes:</span>
                            {Object.entries(activity.details.changes).map(([key, value]: [string, any]) => (
                              <div key={key} className="flex items-center gap-2 mt-1">
                                <span className="text-gray-400">{key}:</span>
                                <span className="text-red-500 line-through">{value.from}</span>
                                <span className="text-gray-400">→</span>
                                <span className="text-green-500">{value.to}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Project indicator */}
                      {activity.task?.project && (
                        <div className="flex-shrink-0 flex items-center gap-1">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: activity.task.project.color }}
                          />
                          <span className="text-xs text-gray-400 hidden sm:inline">
                            {activity.task.project.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-600">No activity found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchQuery || filterAction !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Activity will appear here as you work on tasks'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Activity Summary</CardTitle>
          <CardDescription>Overview of all activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-sm text-gray-500">Total Activities</p>
              <p className="text-2xl font-bold">{activities.length}</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <p className="text-sm text-gray-500">Today</p>
              <p className="text-2xl font-bold">
                {activities.filter(a => 
                  format(new Date(a.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                ).length}
              </p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <p className="text-sm text-gray-500">This Week</p>
              <p className="text-2xl font-bold">
                {activities.filter(a => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(a.created_at) >= weekAgo;
                }).length}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <p className="text-sm text-gray-500">Most Active</p>
              <p className="text-sm font-medium truncate">
                {(() => {
                  const userCounts = activities.reduce((acc: any, curr) => {
                    const name = curr.user?.username || 'Unknown';
                    acc[name] = (acc[name] || 0) + 1;
                    return acc;
                  }, {});
                  const mostActive = Object.entries(userCounts).sort((a:any, b:any) => b[1] - a[1])[0];
                  return mostActive ? `${mostActive[0]} (${mostActive[1]})` : 'No activity';
                })()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}