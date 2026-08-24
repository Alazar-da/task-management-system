// components/NavBar.tsx
"use client";

import { useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  User,
  Search,
  LogOut,
  Settings,
  Sun,
  Moon,
  ChevronDown,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useUser } from "@/hooks/use-user";
import Image from "next/image";
import Link from "next/link";
import { useTasks } from "@/services/taskService";

interface NavBarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isCollapsed?: boolean;
}

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  type?: 'task' | 'project' | 'comment' | 'mention';
  link?: string;
}

export default function NavBar({
  sidebarOpen,
  setSidebarOpen,
  isCollapsed = false,
}: NavBarProps) {
  const router = useRouter();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
/*   const [notifications, setNotifications] = useState<Notification[]>([
    { 
      id: "1", 
      title: "Task assigned to you", 
      description: "Review the new design proposal", 
      time: "2m ago", 
      unread: true,
      type: 'task',
      link: "/tasks/1"
    },
    { 
      id: "2", 
      title: "Project updated", 
      description: "Project 'Website Redesign' status changed to In Progress", 
      time: "15m ago", 
      unread: true,
      type: 'project',
      link: "/projects/1"
    },
    { 
      id: "3", 
      title: "New comment", 
      description: "John commented on your task", 
      time: "1h ago", 
      unread: true,
      type: 'comment',
      link: "/tasks/2"
    },
    { 
      id: "4", 
      title: "You were mentioned", 
      description: "Jane mentioned you in a comment", 
      time: "3h ago", 
      unread: false,
      type: 'mention',
      link: "/tasks/3"
    },
  ]);
   */
  const { theme, setTheme } = useTheme();
  const supabase = createClient();
  const { user } = useUser();
  const { data: allTasks } = useTasks();
  const searchRef = useRef<HTMLDivElement>(null);

  const getInitials = (username?: string) =>
    username?.split(" ")[0]?.slice(0, 2).toUpperCase() || "U";

  /* const unreadCount = notifications.filter((n) => n.unread).length; */

  // Handle search
  useEffect(() => {
    if (searchQuery.trim().length > 0 && allTasks) {
      const results = allTasks.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results.slice(0, 5)); // Limit to 5 results
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery, allTasks]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSelect = (taskId: string) => {
    setSearchQuery("");
    setShowSearchResults(false);
    router.push(`/tasks/${taskId}`);
  };

/*   const dismissNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
    toast.success("All notifications marked as read");
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, unread: false } : n
    ));
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'task':
        return <Check className="h-4 w-4 text-blue-500" />;
      case 'project':
        return <Check className="h-4 w-4 text-purple-500" />;
      case 'comment':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'mention':
        return <Check className="h-4 w-4 text-yellow-500" />;
      default:
        return <Check className="h-4 w-4 text-gray-400" />;
    }
  }; */

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between gap-3",
        "border-b border-gray-200 dark:border-gray-800",
        "bg-white dark:bg-gray-900",
        "px-4 lg:px-6",
        "shadow-sm",
        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        !isCollapsed ? "lg:pl-89" : "lg:pl-32"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setSidebarOpen(!sidebarOpen);
          }}
          className="hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search Bar with Results */}
        <div className="hidden md:block relative" ref={searchRef}>
          <Search
            className={cn(
              "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors",
              searchFocused ? "text-primary" : "text-gray-400"
            )}
          />
          <Input
            placeholder="Search tasks..."
            className={cn(
              "w-64 lg:w-80 pl-9 pr-4 h-10",
              "bg-gray-50 dark:bg-gray-800",
              "border-gray-200 dark:border-gray-700",
              "focus:bg-white dark:focus:bg-gray-800",
              "transition-all duration-200"
            )}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              setSearchFocused(true);
              if (searchQuery.trim().length > 0) {
                setShowSearchResults(true);
              }
            }}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
            ⌘K
          </kbd>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
              <div className="p-2">
                <p className="text-xs text-gray-500 px-2 py-1">Tasks</p>
                {searchResults.map((task) => (
                  <button
                    key={task.id}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors flex items-center gap-3"
                    onClick={() => handleSearchSelect(task.id)}
                  >
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: task.project?.color || '#3B82F6' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">
                          {task.project?.name || 'No Project'}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <Badge className="text-[10px]" variant="outline">
                          {task.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    {task.assignee && (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {getInitials(task.assignee.username)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800 p-2">
                <button
                  className="w-full text-center text-sm text-primary hover:underline"
                  onClick={() => {
                    router.push(`/tasks?search=${encodeURIComponent(searchQuery)}`);
                    setShowSearchResults(false);
                    setSearchQuery("");
                  }}
                >
                  View all results
                </button>
              </div>
            </div>
          )}

          {/* No Results */}
          {showSearchResults && searchQuery.trim().length > 0 && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 text-center z-50">
              <p className="text-sm text-gray-500">No tasks found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search</p>
            </div>
          )}
        </div>

        {/* Mobile Search */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => router.push('/tasks')}
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* Notifications */}
{/*         <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-red-500 hover:bg-red-600">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-4 py-3">
              <DropdownMenuLabel className="p-0 text-sm font-semibold">
                Notifications
              </DropdownMenuLabel>
              {unreadCount > 0 && (
                <button 
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 group relative",
                      n.unread && "bg-blue-50 dark:bg-blue-950/10"
                    )}
                  >
                    <div className="mt-1.5 flex-shrink-0">
                      <span
                        className={cn(
                          "block h-2 w-2 rounded-full",
                          n.unread ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link 
                        href={n.link || "#"} 
                        className="block"
                        onClick={() => markAsRead(n.id)}
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{n.title}</p>
                          {n.unread && (
                            <Badge className="text-[8px] bg-primary text-white">New</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{n.description}</p>
                        <p className="mt-1 text-[10px] text-gray-400">{n.time}</p>
                      </Link>
                    </div>
                    <button
                      onClick={() => dismissNotification(n.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 flex-shrink-0"
                      aria-label="Dismiss notification"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500">No notifications</p>
                  <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center py-2.5 text-sm font-medium text-primary hover:text-primary"
              onClick={() => router.push("/notifications")}
            >
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 h-10 rounded-lg"
              aria-label="Account menu"
            >
              <Avatar className="h-8 w-8">
                {user?.avatar_url ? (
                  <Image 
                    src={user.avatar_url} 
                    alt={user.username || "User"} 
                    width={32} 
                    height={32} 
                    className="rounded-full object-cover" 
                  />
                ) : (
                  <AvatarFallback className="text-gray-900 dark:text-white dark:bg-gray-600 text-sm font-semibold">
                    {getInitials(user?.username)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium leading-tight">
                  {user?.username || "User"}
                </p>
              </div>
              <ChevronDown className="hidden lg:block h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-3">
              <p className="text-sm font-semibold">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/profile")}
              className="py-2.5 cursor-pointer"
            >
              <User className="mr-2.5 h-4 w-4" />
              Profile
            </DropdownMenuItem>
         {/*    <DropdownMenuItem
              onClick={() => router.push("/settings")}
              className="py-2.5 cursor-pointer"
            >
              <Settings className="mr-2.5 h-4 w-4" />
              Settings
            </DropdownMenuItem> */}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="py-2.5 text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40"
              onClick={async () => {
                await supabase.auth.signOut();
                toast.success("Logged out successfully");
                router.push("/login");
              }}
            >
              <LogOut className="mr-2.5 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}