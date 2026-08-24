// app/calendar/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTasks } from "@/services/taskService";
import { useProjects } from "@/services/projectService";
import { useUser } from "@/hooks/use-user";
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
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  Plus,
  Filter,
  X,
  CheckCircle2,
  AlertCircle,
  Circle,
  Users,
  FolderKanban,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, parseISO, isBefore, isAfter, addDays } from "date-fns";
import { cn } from "@/lib/utils";

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

type TaskPriority = keyof typeof priorityColors;
type TaskStatus = keyof typeof statusColors;

const getPriorityClass = (priority?: string) =>
  priorityColors[(priority as TaskPriority) ?? 'medium'];

const getStatusClass = (status?: string) =>
  statusColors[(status as TaskStatus) ?? 'todo'];

export default function CalendarPage() {
  const router = useRouter();
  const { user } = useUser();
  const { data: allTasks, isLoading, refetch } = useTasks();
  const { data: projects } = useProjects();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [view, setView] = useState<'month' | 'week'>('month');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Get tasks for the current month
  const getTasksForDate = (date: Date) => {
    if (!allTasks) return [];
    
    return allTasks.filter(task => {
      if (!task.due_date) return false;
      
      // Filter by project
      if (filterProject !== 'all' && task.project_id !== filterProject) return false;
      
      // Filter by status
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      
      const taskDate = parseISO(task.due_date);
      return isSameDay(taskDate, date);
    });
  };

  // Get tasks for a range of dates
  const getTasksForRange = (start: Date, end: Date) => {
    if (!allTasks) return [];
    
    return allTasks.filter(task => {
      if (!task.due_date) return false;
      
      if (filterProject !== 'all' && task.project_id !== filterProject) return false;
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      
      const taskDate = parseISO(task.due_date);
      return taskDate >= start && taskDate <= end;
    });
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  };

  // Generate week days
  const generateWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  };

  const getDayTasks = (date: Date) => {
    const tasks = getTasksForDate(date);
    // Sort by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return tasks.sort((a, b) => (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4));
  };

  const handlePrevious = () => {
    setCurrentDate(view === 'month' ? subMonths(currentDate, 1) : addDays(currentDate, -7));
  };

  const handleNext = () => {
    setCurrentDate(view === 'month' ? addMonths(currentDate, 1) : addDays(currentDate, 7));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const tasks = getTasksForDate(date);
    if (tasks.length > 0) {
      setSelectedTask(tasks[0]);
      setIsTaskDialogOpen(true);
    }
  };

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setIsTaskDialogOpen(true);
  };

  const getUpcomingTasks = () => {
    if (!allTasks) return [];
    const now = new Date();
    const nextWeek = addDays(now, 7);
    
    return allTasks
      .filter(task => {
        if (!task.due_date) return false;
        if (task.status === 'done') return false;
        const taskDate = parseISO(task.due_date);
        return taskDate >= now && taskDate <= nextWeek;
      })
      .sort((a: any, b: any) => {
        const dateA = parseISO(a.due_date);
        const dateB = parseISO(b.due_date);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 5);
  };

  const calendarDays = generateCalendarDays();
  const weekDays = generateWeekDays();
  const upcomingTasks = getUpcomingTasks();

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
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            View and manage your tasks by date
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="border rounded-lg p-1 flex">
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
            >
              Month
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('week')}
            >
              Week
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">Filters:</span>
        </div>
        <Select value={filterProject}   onValueChange={(value) => setFilterProject(value ?? "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects?.map(project => (
              <SelectItem key={project.id} value={project.id}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                  {project.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus}   onValueChange={(value) => setFilterStatus(value ?? "all")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="review">Review</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>

        {(filterProject !== 'all' || filterStatus !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterProject('all');
              setFilterStatus('all');
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {view === 'month' 
                    ? format(currentDate, 'MMMM yyyy')
                    : `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
                  }
                </CardTitle>
                <CardDescription>
                  {view === 'month' 
                    ? `${format(startOfMonth(currentDate), 'MMM d')} - ${format(endOfMonth(currentDate), 'MMM d, yyyy')}`
                    : `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
                  }
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {/* Month View */}
              {view === 'month' && (
                <div className="grid grid-cols-7 gap-1">
                  {/* Week day headers */}
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days */}
                  {calendarDays.map((day, index) => {
                    const dayTasks = getDayTasks(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isTodayDate = isToday(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    
                    return (
                      <div
                        key={index}
                        className={cn(
                          "min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors",
                          isCurrentMonth ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50',
                          isTodayDate && 'border-primary',
                          isSelected && 'ring-2 ring-primary',
                          'hover:bg-gray-50 dark:hover:bg-gray-800'
                        )}
                        onClick={() => handleDateClick(day)}
                      >
                        <div className={cn(
                          "text-sm font-medium mb-1",
                          isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400',
                          isTodayDate && 'text-primary'
                        )}>
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-1">
                          {dayTasks.slice(0, 3).map(task => (
                            <div
                              key={task.id}
                              className="text-xs p-1 rounded truncate cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                              style={{
                                backgroundColor: task.status === 'done' ? '#10B98120' : 'transparent',
                                borderLeft: `3px solid ${task.project?.color || '#3B82F6'}`
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskClick(task);
                              }}
                            >
                              <span className={cn(
                                task.status === 'done' && 'line-through text-gray-400'
                              )}>
                                {task.title}
                              </span>
                            </div>
                          ))}
                          {dayTasks.length > 3 && (
                            <div className="text-xs text-gray-400">
                              +{dayTasks.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Week View */}
              {view === 'week' && (
                <div className="grid grid-cols-7 gap-1">
                  {weekDays.map((day) => {
                    const dayTasks = getDayTasks(day);
                    const isTodayDate = isToday(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    
                    return (
                      <div key={day.toString()}>
                        <div className={cn(
                          "text-center py-2 border-b",
                          isTodayDate && 'border-primary'
                        )}>
                          <div className={cn(
                            "text-sm font-medium",
                            isTodayDate && 'text-primary'
                          )}>
                            {format(day, 'EEE')}
                          </div>
                          <div className={cn(
                            "text-2xl font-bold",
                            isTodayDate && 'text-primary'
                          )}>
                            {format(day, 'd')}
                          </div>
                        </div>
                        <div className="space-y-2 mt-2">
                          {dayTasks.map(task => (
                            <div
                              key={task.id}
                              className="text-xs p-2 rounded border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                              onClick={() => handleTaskClick(task)}
                            >
                              <div className="font-medium truncate">{task.title}</div>
                              <div className="flex items-center gap-1 mt-1">
                                <Badge className={cn("text-[10px]", priorityColors[task.priority])}>
                                  {task.priority}
                                </Badge>
                                {task.project && (
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.project.color }} />
                                    <span className="text-[10px] text-gray-400">{task.project.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {dayTasks.length === 0 && (
                            <div className="text-center text-xs text-gray-400 py-4">
                              No tasks
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Upcoming Tasks */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Upcoming (Next 7 Days)</CardTitle>
              <CardDescription>Tasks due soon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTasks.length > 0 ? (
                  upcomingTasks.map((task:any) => {
                    const dueDate = parseISO(task.due_date);
                    const isTodaysDate = isToday(dueDate);
                    const isTomorrow = isSameDay(dueDate, addDays(new Date(), 1));
                    
                    let dateLabel = format(dueDate, 'MMM d');
                    if (isTodaysDate) dateLabel = 'Today';
                    else if (isTomorrow) dateLabel = 'Tomorrow';
                    
                    return (
                      <div
                        key={task.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => router.push(`/tasks/${task.id}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{task.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={cn("text-[10px]", getPriorityClass(task.priority))}>
                                {task.priority}
                              </Badge>
                              <span className="text-xs text-gray-500">{dateLabel}</span>
                            </div>
                          </div>
                          {isTodaysDate && (
                            <Badge className="bg-red-500 text-white text-[10px]">
                              Due Today
                            </Badge>
                          )}
                        </div>
                        {task.project && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                            <FolderKanban className="h-3 w-3" />
                            {task.project.name}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
                    <p className="text-sm text-gray-500">No upcoming tasks!</p>
                    <p className="text-xs text-gray-400">You're all caught up 🎉</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Task Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Tasks</span>
                <span className="font-medium">{allTasks?.length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Completed</span>
                <span className="font-medium text-green-600">
                  {allTasks?.filter(t => t.status === 'done').length || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">In Progress</span>
                <span className="font-medium text-blue-600">
                  {allTasks?.filter(t => t.status === 'in_progress').length || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Overdue</span>
                <span className="font-medium text-red-600">
                  {allTasks?.filter(t => t.due_date && t.status !== 'done' && isBefore(parseISO(t.due_date), new Date())).length || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task Detail Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
            <DialogDescription>
              {selectedTask?.description || 'No description provided'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 flex-wrap">
              <Badge className={cn("font-medium", getStatusClass(selectedTask?.status || 'todo'))}>
                {selectedTask?.status?.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge className={cn("font-medium", getPriorityClass(selectedTask?.priority || 'medium'))}>
                {selectedTask?.priority?.toUpperCase()}
              </Badge>
            </div>
            
            {selectedTask?.project && (
              <div className="flex items-center gap-2 text-sm">
                <FolderKanban className="h-4 w-4 text-gray-400" />
                <span>{selectedTask.project.name}</span>
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: selectedTask.project.color }}
                />
              </div>
            )}
            
            {selectedTask?.assignee && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-gray-400" />
                <span>Assigned to: {selectedTask.assignee.username}</span>
              </div>
            )}
            
            {selectedTask?.due_date && (
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
                <span>Due: {format(parseISO(selectedTask.due_date), 'PPP')}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsTaskDialogOpen(false);
              router.push(`/tasks/${selectedTask?.id}`);
            }}>
              View Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}