"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface DashboardNavbarProps {
  title?: string;
  subtitle?: string;
}

export function DashboardNavbar({ title = "Dashboard", subtitle }: DashboardNavbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border bg-sidebar px-4">
      <SidebarTrigger className="mx-2" />
      
      <div className="flex-1">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-sidebar-foreground/60">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search posts, schedules..."
            className="pl-8"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
          >
            3
          </Badge>
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}