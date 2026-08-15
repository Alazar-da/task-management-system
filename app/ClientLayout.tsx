"use client";
import NavBar from "@/components/NavBar";
import SideBar from "@/components/SideBar";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {Toaster} from "react-hot-toast";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Load collapse state from localStorage
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapse state
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed));
    }
  }, [isCollapsed, isMounted]);

  const isAuthPage = pathname === "/auth/login" || pathname.startsWith("/auth/reset-password");

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!isMounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {!isAuthPage && (
        <NavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isCollapsed={isCollapsed}
        />
      )}
      <main
        className={cn(
          "flex-1 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] p-4",
          !isAuthPage && "lg:ml-[260px]",
          !isAuthPage && isCollapsed && "lg:ml-[72px]",
          "mt-0"
        )}
      >
        {children}
      </main>
     <Toaster
  position="top-center"
  reverseOrder={false}
/>
      {!isAuthPage && (
        <SideBar
          isOpen={sidebarOpen}
          onNavigate={() => setSidebarOpen(false)}
          isCollapsed={isCollapsed}
          onCollapseToggle={toggleCollapse}
        />
      )}
    </div>
  );
}