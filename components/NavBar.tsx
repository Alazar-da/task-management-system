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
import { useState } from "react";
import { toast } from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useUser } from "@/hooks/use-user";
import Image from "next/image";

interface NavBarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isCollapsed?: boolean;
}

const notifications = [
  { id: 1, title: "New order received", desc: "Order #ORD-1024", time: "2m ago", unread: true },
  { id: 2, title: "Payment confirmed", desc: "Order #ORD-1023", time: "15m ago", unread: true },
  { id: 3, title: "New user registered", desc: "jane@example.com", time: "1h ago", unread: true },
  { id: 4, title: "Inventory low", desc: "3 products below threshold", time: "3h ago", unread: false },
];

export default function NavBar({
  sidebarOpen,
  setSidebarOpen,
  isCollapsed = false,
}: NavBarProps) {
  const router = useRouter();
  const [searchFocused, setSearchFocused] = useState(false);
  const { theme, setTheme } = useTheme();
  const supabase = createClient();
  const { user } = useUser();

  const getInitials = (username?: string) =>
    username?.split(" ")[0]?.slice(0, 2).toUpperCase() || "U";

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between gap-3",
        "border-b border-gray-200 dark:border-gray-800",
        "bg-white dark:bg-gray-900",
        "px-4 lg:px-6",
        "shadow-sm",
        "",
        // Adjust left padding based on sidebar state
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

        {/* Search Bar */}
        <div className="hidden md:block relative">
          <Search
            className={cn(
              "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors",
              searchFocused ? "text-primary" : "text-gray-400"
            )}
          />
          <Input
            placeholder="Search..."
            className={cn(
              "w-64 lg:w-80 pl-9 pr-4 h-10",
              "bg-gray-50 dark:bg-gray-800",
              "border-gray-200 dark:border-gray-700",
              "focus:bg-white dark:focus:bg-gray-800",
              "transition-all duration-200"
            )}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
            ⌘K
          </kbd>
        </div>

        {/* Mobile Search */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden hover:bg-gray-100 dark:hover:bg-gray-800"
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
        <DropdownMenu>
          <DropdownMenuTrigger>
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
              <button className="text-xs font-medium text-primary hover:underline">
                Mark all read
              </button>
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className="flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="mt-1.5">
                    <span
                      className={cn(
                        "block h-2 w-2 rounded-full",
                        n.unread ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{n.desc}</p>
                    <p className="mt-1 text-[10px] text-gray-400">{n.time}</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center py-2.5 text-sm font-medium text-primary hover:text-primary"
              onClick={() => router.push("/notifications")}
            >
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 h-10 rounded-lg"
              aria-label="Account menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-gray-900 dark:text-white dark:bg-gray-600 text-sm font-semibold">
                  {user?.avatar_url ? (
                    <Image src={user?.avatar_url} alt={user?.username} width={32} height={32} className="rounded-full object-cover" />
                  ) : (
                    getInitials(user?.username)
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium leading-tight">
                  {user?.username || "User"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                  {user?.role}
                </p>
              </div>
              <ChevronDown className="hidden lg:block h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-3">
              <p className="text-sm font-semibold">{user?.email}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/profile")}
              className="py-2.5 cursor-pointer"
            >
              <User className="mr-2.5 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/settings")}
              className="py-2.5 cursor-pointer"
            >
              <Settings className="mr-2.5 h-4 w-4" />
              Settings
            </DropdownMenuItem>
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