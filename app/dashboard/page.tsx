// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useTasks } from "@/services/taskService";
import { useProjects } from "@/services/projectService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  ClipboardList,
  CheckCircle2,
  FolderKanban,
  TrendingUp,
  Plus,
  Calendar,
  Clock,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from "date-fns";
import { cn } from "@/lib/utils";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { data: allTasks, isLoading: tasksLoading, refetch: refetchTasks } = useTasks();
  const { data: projects, isLoading: projectsLoading } = useProjects();

  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    todo: 0,
    review: 0,
    overdue: 0,
  });

  // Calculate stats
  useEffect(() => {
    if (allTasks) {
      // Filter tasks assigned to current user
      const userTasks = allTasks.filter(task => task.assignee_id === user?.id);
      
      const total = userTasks.length;
      const completed = userTasks.filter(t => t.status === 'done').length;
      const inProgress = userTasks.filter(t => t.status === 'in_progress').length;
      const todo = userTasks.filter(t => t.status === 'todo').length;
      const review = userTasks.filter(t => t.status === 'review').length;
      
      // Calculate overdue tasks
      const overdue = userTasks.filter(t => {
        if (!t.due_date || t.status === 'done') return false;
        return isBefore(new Date(t.due_date), new Date());
      }).length;

      setTaskStats({
        total,
        completed,
        inProgress,
        todo,
        review,
        overdue,
      });

      // Get recent tasks (last 5)
      const sortedTasks = [...userTasks].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRecentTasks(sortedTasks.slice(0, 5));

      // Get upcoming deadlines (next 7 days, not completed)
      const now = new Date();
      const nextWeek = addDays(now, 7);
      const upcoming = userTasks
        .filter(t => t.due_date && t.status !== 'done')
        .filter((t: any) => {
          const dueDate = new Date(t.due_date);
          return isAfter(dueDate, now) && isBefore(dueDate, nextWeek);
        })
        .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
      
      setUpcomingDeadlines(upcoming.slice(0, 5));
    }
  }, [allTasks, user]);

  // Calculate progress
  const completionRate = taskStats.total > 0 
    ? Math.round((taskStats.completed / taskStats.total) * 100) 
    : 0;

  // Data for charts
  const statusData = [
    { name: 'To Do', value: taskStats.todo, color: '#F59E0B' },
    { name: 'In Progress', value: taskStats.inProgress, color: '#3B82F6' },
    { name: 'Review', value: taskStats.review, color: '#8B5CF6' },
    { name: 'Done', value: taskStats.completed, color: '#10B981' },
  ];

  const progressData = [
    { name: 'Completed', value: taskStats.completed },
    { name: 'Remaining', value: taskStats.total - taskStats.completed },
  ];

  if (userLoading || tasksLoading || projectsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8 px-4 mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Welcome back, {user?.username || 'User'}! Here's an overview of your work.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/tasks')}>
            <ClipboardList className="h-4 w-4 mr-2" />
            View All Tasks
          </Button>
          <Button variant="outline" onClick={() => router.push('/projects/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Tasks</p>
                <p className="text-2xl font-bold">{taskStats.total}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-full">
                <ClipboardList className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold">{taskStats.completed}</p>
                <p className="text-xs text-gray-400">{completionRate}% completion rate</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Projects</p>
                <p className="text-2xl font-bold">{projects?.length || 0}</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-full">
                <FolderKanban className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overdue</p>
                <p className="text-2xl font-bold text-red-500">{taskStats.overdue}</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-full">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Task Status Distribution</CardTitle>
            <CardDescription>Overview of tasks by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Your Progress</CardTitle>
            <CardDescription>Tasks completed vs remaining</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                    {progressData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? '#10B981' : '#94A3B8'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                <span className="font-bold text-primary">{completionRate}%</span> of tasks completed
                <span className="mx-2">•</span>
                <span className="font-medium">{taskStats.completed}</span> completed
                <span className="mx-1">/</span>
                <span className="font-medium">{taskStats.total}</span> total
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">Recent Tasks</CardTitle>
              <CardDescription>Your most recently created tasks</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/tasks')}>
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                    onClick={() => router.push(`/tasks/${task.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {task.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {task.project && (
                          <span className="text-xs text-gray-500">
                            {task.project.name}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    {task.assignee && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={task.assignee.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {task.assignee.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No recent tasks</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
              <CardDescription>Tasks due in the next 7 days</CardDescription>
            </div>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((task) => {
                  const dueDate = new Date(task.due_date);
                  const isToday = format(dueDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  const isTomorrow = format(dueDate, 'yyyy-MM-dd') === format(addDays(new Date(), 1), 'yyyy-MM-dd');
                  
                  let dateLabel = format(dueDate, 'MMM d, yyyy');
                  if (isToday) dateLabel = 'Today';
                  else if (isTomorrow) dateLabel = 'Tomorrow';
                  
                  const priorityColors = {
                    low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
                    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
                    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
                  };

                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                      onClick={() => router.push(`/tasks/${task.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge className={cn("text-xs", priorityColors[task.priority])}>
                            {task.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {task.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {dateLabel}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isToday && (
                          <Badge className="bg-red-500 text-white text-xs">
                            Due Today
                          </Badge>
                        )}
                        {task.assignee && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={task.assignee.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {task.assignee.username?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
                  <p className="text-sm text-gray-500">No upcoming deadlines!</p>
                  <p className="text-xs text-gray-400">You're all caught up 🎉</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          <CardDescription>Common tasks to help you get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push('/tasks')}
            >
              <ClipboardList className="h-5 w-5" />
              <span className="text-sm">View Tasks</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push('/projects')}
            >
              <FolderKanban className="h-5 w-5" />
              <span className="text-sm">View Projects</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push('/projects/new')}
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm">New Project</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push('/profile')}
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm">View Profile</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}