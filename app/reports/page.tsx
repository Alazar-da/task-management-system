// app/reports/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTasks } from "@/services/taskService";
import { useProjects } from "@/services/projectService";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Area,
  AreaChart,
} from "recharts";
import {
  Download,
  Loader2,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
const STATUS_COLORS = {
  todo: '#F59E0B',
  in_progress: '#3B82F6',
  review: '#8B5CF6',
  done: '#10B981',
};

export default function ReportsPage() {
  const router = useRouter();
  const { user } = useUser();
  const { data: allTasks, isLoading: tasksLoading } = useTasks();
  const { data: projects, isLoading: projectsLoading } = useProjects();

  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'year'>('30d');
  const [reportType, setReportType] = useState<'overview' | 'tasks' | 'projects' | 'productivity'>('overview');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');

  if (tasksLoading || projectsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case '7d':
        return { start: subMonths(now, 1), end: now };
      case '30d':
        return { start: subMonths(now, 1), end: now };
      case '90d':
        return { start: subMonths(now, 3), end: now };
      case 'year':
        return { start: subMonths(now, 12), end: now };
      default:
        return { start: subMonths(now, 1), end: now };
    }
  };

  const { start, end } = getDateRange();

  // Filter tasks by date range
  const filteredTasks = allTasks?.filter(task => {
    const taskDate = parseISO(task.created_at);
    return taskDate >= start && taskDate <= end;
  }) || [];

  // User's tasks (assigned to current user)
  const userTasks = filteredTasks.filter(task => task.assignee_id === user?.id);

  // Statistics
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.status === 'done').length;
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress').length;
  const todoTasks = filteredTasks.filter(t => t.status === 'todo').length;
  const reviewTasks = filteredTasks.filter(t => t.status === 'review').length;
  const overdueTasks = filteredTasks.filter(t => {
    if (!t.due_date || t.status === 'done') return false;
    return new Date(t.due_date) < new Date();
  }).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Tasks by priority
  const priorityData = [
    { name: 'Low', value: filteredTasks.filter(t => t.priority === 'low').length },
    { name: 'Medium', value: filteredTasks.filter(t => t.priority === 'medium').length },
    { name: 'High', value: filteredTasks.filter(t => t.priority === 'high').length },
    { name: 'Urgent', value: filteredTasks.filter(t => t.priority === 'urgent').length },
  ].filter(d => d.value > 0);

  // Tasks by status
  const statusData = [
    { name: 'To Do', value: todoTasks, color: STATUS_COLORS.todo },
    { name: 'In Progress', value: inProgressTasks, color: STATUS_COLORS.in_progress },
    { name: 'Review', value: reviewTasks, color: STATUS_COLORS.review },
    { name: 'Done', value: completedTasks, color: STATUS_COLORS.done },
  ];

  // Tasks by project
  const projectData = projects?.map(project => ({
    name: project.name,
    value: filteredTasks.filter(t => t.project_id === project.id).length,
    color: project.color,
  })).filter(d => d.value > 0) || [];

  // Daily task completion trend
  const getDailyTrend = () => {
    const days = eachDayOfInterval({ start, end });
    return days.map(day => {
      const dayTasks = filteredTasks.filter(t => isSameDay(parseISO(t.created_at), day));
      const completed = dayTasks.filter(t => t.status === 'done').length;
      return {
        date: format(day, 'MMM d'),
        created: dayTasks.length,
        completed,
      };
    });
  };

  const trendData = getDailyTrend();

  // User productivity
  const userProductivity = allTasks?.filter(t => t.assignee_id === user?.id).reduce((acc, task) => {
    const status = task.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const productivityData = userProductivity ? [
    { name: 'To Do', value: userProductivity.todo || 0 },
    { name: 'In Progress', value: userProductivity.in_progress || 0 },
    { name: 'Review', value: userProductivity.review || 0 },
    { name: 'Done', value: userProductivity.done || 0 },
  ] : [];

  const handleExport = () => {
    // Generate CSV report
    const headers = ['Title', 'Status', 'Priority', 'Project', 'Assignee', 'Due Date', 'Created At'];
    const rows = filteredTasks.map(task => [
      task.title,
      task.status,
      task.priority,
      task.project?.name || 'No Project',
      task.assignee?.username || 'Unassigned',
      task.due_date ? format(parseISO(task.due_date), 'MM/dd/yyyy') : 'No Due Date',
      format(parseISO(task.created_at), 'MM/dd/yyyy'),
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container max-w-7xl py-8 px-4 mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gain insights into your productivity and task management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <Button
          variant={reportType === 'overview' ? 'default' : 'outline'}
          onClick={() => setReportType('overview')}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={reportType === 'tasks' ? 'default' : 'outline'}
          onClick={() => setReportType('tasks')}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Tasks
        </Button>
        <Button
          variant={reportType === 'projects' ? 'default' : 'outline'}
          onClick={() => setReportType('projects')}
        >
          <FolderKanban className="h-4 w-4 mr-2" />
          Projects
        </Button>
        <Button
          variant={reportType === 'productivity' ? 'default' : 'outline'}
          onClick={() => setReportType('productivity')}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Productivity
        </Button>
      </div>

      {/* Overview Section */}
      {reportType === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Tasks</p>
                    <p className="text-2xl font-bold">{totalTasks}</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-full">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Completion Rate</p>
                    <p className="text-2xl font-bold text-green-600">{completionRate}%</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-full">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{inProgressTasks}</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-full">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">{overdueTasks}</p>
                  </div>
                  <div className="p-3 bg-red-500/10 rounded-full">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Task Status Distribution</CardTitle>
                <CardDescription>Overview of tasks by current status</CardDescription>
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
                        label={({ name, percent }) => `${name} ${((percent? percent : 0) * 100).toFixed(0)}%`}
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

            {/* Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Tasks by Priority</CardTitle>
                <CardDescription>Distribution of task priorities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {priorityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={priorityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">No priority data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Tasks Section */}
      {reportType === 'tasks' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Trend */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium">Task Trends</CardTitle>
                    <CardDescription>Daily task creation and completion</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant={chartType === 'bar' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setChartType('bar')}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={chartType === 'line' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setChartType('line')}
                    >
                      <LineChartIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={chartType === 'area' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setChartType('area')}
                    >
                      <PieChartIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                      <BarChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="created" fill="#3B82F6" name="Created" />
                        <Bar dataKey="completed" fill="#10B981" name="Completed" />
                      </BarChart>
                    ) : chartType === 'area' ? (
                      <AreaChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="created" stroke="#3B82F6" fill="#3B82F640" name="Created" />
                        <Area type="monotone" dataKey="completed" stroke="#10B981" fill="#10B98140" name="Completed" />
                      </AreaChart>
                    ) : (
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="created" stroke="#3B82F6" name="Created" />
                        <Line type="monotone" dataKey="completed" stroke="#10B981" name="Completed" />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Task Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Task Statistics</CardTitle>
                <CardDescription>Detailed breakdown of your tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <p className="text-sm text-gray-500">Total Tasks</p>
                      <p className="text-2xl font-bold text-blue-600">{totalTasks}</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <p className="text-sm text-gray-500">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
                    </div>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                      <p className="text-sm text-gray-500">In Progress</p>
                      <p className="text-2xl font-bold text-yellow-600">{inProgressTasks}</p>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <p className="text-sm text-gray-500">Overdue</p>
                      <p className="text-2xl font-bold text-red-600">{overdueTasks}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span className="font-medium">{completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Projects Section */}
      {reportType === 'projects' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tasks by Project */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Tasks by Project</CardTitle>
                <CardDescription>Distribution of tasks across projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {projectData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={projectData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${((percent? percent : 0) * 100).toFixed(0)}%`}
                        >
                          {projectData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">No project data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Project Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Project Overview</CardTitle>
                <CardDescription>Key metrics for your projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                      <p className="text-sm text-gray-500">Total Projects</p>
                      <p className="text-2xl font-bold text-purple-600">{projects?.length || 0}</p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <p className="text-sm text-gray-500">Active Projects</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {projects?.filter(p => p.status !== 'Completed').length || 0}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Projects with Most Tasks</p>
                    {projectData.slice(0, 5).map((project, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color || COLORS[index % COLORS.length] }} />
                          <span>{project.name}</span>
                        </div>
                        <span className="font-medium">{project.value} tasks</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Productivity Section */}
      {reportType === 'productivity' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Productivity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Your Productivity</CardTitle>
                <CardDescription>Distribution of your tasks by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {productivityData.some(d => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={productivityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${((percent? percent : 0) * 100).toFixed(0)}%`}
                        >
                          {productivityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">No productivity data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Productivity Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Productivity Metrics</CardTitle>
                <CardDescription>Your performance at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <p className="text-sm text-gray-500">Tasks Completed</p>
                      <p className="text-2xl font-bold text-green-600">
                        {allTasks?.filter(t => t.assignee_id === user?.id && t.status === 'done').length || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <p className="text-sm text-gray-500">In Progress</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {allTasks?.filter(t => t.assignee_id === user?.id && t.status === 'in_progress').length || 0}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Completion Rate</span>
                        <span className="font-medium">
                          {allTasks && allTasks?.filter(t => t.assignee_id === user?.id).length > 0
                            ? Math.round((allTasks?.filter(t => t.assignee_id === user?.id && t.status === 'done').length || 0) / 
                              (allTasks?.filter(t => t.assignee_id === user?.id).length || 1) * 100)
                            : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${allTasks && allTasks?.filter(t => t.assignee_id === user?.id).length > 0
                              ? Math.round((allTasks?.filter(t => t.assignee_id === user?.id && t.status === 'done').length || 0) / 
                                (allTasks?.filter(t => t.assignee_id === user?.id).length || 1) * 100)
                              : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-500 mb-2">Priority Breakdown</p>
                    <div className="space-y-1">
                      {['urgent', 'high', 'medium', 'low'].map(priority => {
                        const count = allTasks?.filter(t => t.assignee_id === user?.id && t.priority === priority).length || 0;
                        return (
                          <div key={priority} className="flex items-center justify-between text-sm">
                            <span className="capitalize">{priority}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}