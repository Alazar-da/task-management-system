"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  UserCircle,
  LogOut,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  type LucideIcon,
  Calendar,
  CheckSquare,
  FolderKanban,
  Activity,
  Folder,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUser } from "@/hooks/use-user";
import { Avatar, AvatarFallback } from "./ui/avatar";
import Image from "next/image";

type MenuItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

interface SidebarProps {
  isOpen: boolean; // mobile open / desktop expanded
  onNavigate?: () => void; // close mobile on nav
  isCollapsed?: boolean; // desktop collapsed state
  onCollapseToggle?: () => void; // toggle collapse
}

export default function Sidebar({
  isOpen,
  onNavigate,
  isCollapsed = false,
  onCollapseToggle,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [categoryCount, setCategoryCount] = useState<string>();
  const [subCategoryCount, setSubCategoryCount] = useState<string>();
  const [productCount, setProductCount] = useState<string>();
  const { user } = useUser();

  const supabase = createClient();

  const mainItems: MenuItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Tasks", href: "/tasks", icon: CheckSquare, badge: categoryCount },
    { name: "Projects", href: "/projects", icon: FolderKanban, badge: subCategoryCount },
    { name: "Calendar", href: "/calendar", icon: Calendar, badge: productCount },
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ];

  const accountItems: MenuItem[] = [
    { name: "Activity", href: "/activity", icon: Activity },
    { name: "File", href: "/file", icon: Folder },
    { name: "Profile", href: "/profile", icon: UserCircle },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    setTimeout(() => {
      router.push("/");
    }, 1000);
  };

    const getInitials = (username?: string) =>
    username?.split(" ")[0]?.slice(0, 2).toUpperCase() || "U";

  const isItemActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const renderItem = (item: MenuItem) => {
    const isActive = isItemActive(item.href);
    const Icon = item.icon;

    const link = (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "group relative flex items-center rounded-lg text-sm font-medium",
          "transition-all duration-200 py-2 px-3",
          !isCollapsed 
            ? "gap-3" 
            : "justify-center",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-transform duration-200",
            isActive && "scale-110",
            !isActive && "group-hover:scale-110"
          )}
        />

        {!isCollapsed && (
          <>
            <span className="flex-1 truncate text-left">{item.name}</span>
            {item.badge && (
              <span
                className={cn(
                  "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                )}
              >
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );

    // Collapsed: wrap with tooltip
    if (isCollapsed) {
      return (
        <li key={item.href} className="flex justify-center">
          <Tooltip>
            <TooltipTrigger>{link}</TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {item.name}
            </TooltipContent>
          </Tooltip>
        </li>
      );
    }

    return <li key={item.href}>{link}</li>;
  };

  return (
    <TooltipProvider>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 lg:hidden transition-all duration-300 ease-in-out",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onNavigate}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-white dark:bg-gray-900",
          "border-r border-gray-200 dark:border-gray-800 shadow-2xl",
          "flex flex-col overflow-hidden",
          "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          // Mobile
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          // Desktop width
          isCollapsed ? "lg:w-[72px]" : "lg:w-[260px]",
          // Mobile width
          "w-[280px]"
        )}
        aria-label="Main navigation"
      >
        {/* Header / Logo */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-gray-200 dark:border-gray-800",
            isCollapsed ? "lg:justify-center lg:px-0" : "px-4"
          )}
        >
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 overflow-hidden",
              isCollapsed && "lg:justify-center lg:w-full"
            )}
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gray-100 dark:bg-gray-600">
              <span className="text-sm font-bold text-gray-900 dark:text-white">TM</span>
            </div>

            {!isCollapsed && (
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
                  Task management
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* User card */}
        {user && (
          <div className={cn("shrink-0 px-3 pt-4", isCollapsed && "lg:px-2")}>
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-2.5",
                isCollapsed && "lg:justify-center lg:p-2"
              )}
            >
              <div className="relative shrink-0">
               <Avatar className="h-8 w-8">
                <AvatarFallback className="text-gray-900 dark:text-white dark:bg-gray-600 text-sm font-semibold">
                  {user?.avatar_url ? (
                    <Image src={user?.avatar_url} alt={user?.username} width={32} height={32} className="rounded-full object-cover" />
                  ) : (
                    getInitials(user?.username)
                  )}
                </AvatarFallback>
              </Avatar>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-gray-900 bg-green-500" />
              </div>

              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {user.username}
                  </p>
                  {/* <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                    {user.role}
                  </p> */}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav
          className={cn(
            "flex-1 overflow-y-auto py-4",
            "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
            !isCollapsed ? "px-3" : "px-2"
          )}
        >
          {!isCollapsed && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Main
            </p>
          )}
          <ul className={cn(
            "space-y-1",
            isCollapsed && "flex flex-col items-center"
          )}>
            {mainItems.map((item) => renderItem(item))}
          </ul>

          {!isCollapsed ? (
            <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Account
            </p>
          ) : (
            <div className="my-4 mx-2 h-px bg-gray-200 dark:bg-gray-800" />
          )}

          <ul className={cn(
            "space-y-1",
            isCollapsed && "flex flex-col items-center"
          )}>
            {accountItems.map((item) => renderItem(item))}
          </ul>
        </nav>

        {/* Footer */}
        <div
          className={cn(
            "shrink-0 border-t border-gray-200 dark:border-gray-800 p-3 w-full ",
            isCollapsed && "flex flex-col items-center lg:p-2"
          )}
        >
          {/* Logout */}
          <Tooltip>
            <TooltipTrigger>
              <button
                onClick={handleLogout}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg text-sm font-medium py-2 px-3",
                  "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40",
                  "transition-colors duration-200",
                  !isCollapsed ? "" : "justify-center"
                )}
              >
                <LogOut className="h-[18px] w-[18px] shrink-0" />
                {!isCollapsed && <span>Logout</span>}
              </button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">Logout</TooltipContent>
            )}
          </Tooltip>

          {/* Desktop collapse toggle */}
          <button
            onClick={onCollapseToggle}
            className={cn(
              "mt-2 hidden items-center gap-2 rounded-lg py-1.5 text-xs font-medium px-3",
              "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
              "lg:flex",
              !isCollapsed ? "" : "justify-center"
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}