"use client";

import { motion } from "motion/react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSeparator,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@regarde/ui/sidebar";

import { AppSwitcher } from "#navigation/appSwitcher";
import { DashboardNavigation } from "#navigation/dashboardNavigation";
import { Moon } from "lucide-react";
import { cn } from "@regarde/ui/lib/utils";

function SidebarHeaderContent(): React.ReactElement {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className="relative px-3 py-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary">
        <span className="sr-only">Logo</span>
      </div>

      <motion.div
        key={isCollapsed ? "header-collapsed" : "header-expanded"}
        className={cn(
          "flex items-center gap-2",
          isCollapsed
            ? "mt-3 flex-col-reverse"
            : "absolute top-2 right-3 flex-row"
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent">
          <Moon className="h-4.5 w-4.5" />
        </div>
        <SidebarTrigger className="h-8 w-8 [&_svg:not([class*='size-'])]:size-4.5 hover:bg-sidebar-accent" />
      </motion.div>
    </div>
  );
}

export function DashboardSidebar(): React.ReactElement {
  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="mt-1 border-none p-0 group-data-[collapsible=icon]:w-(--sidebar-width-icon)! *:data-[slot='sidebar-inner']:rounded-tr-xs"
    >
      <SidebarHeader className="p-0">
        <SidebarHeaderContent />
      </SidebarHeader>
      <SidebarContent>
        <DashboardNavigation />
      </SidebarContent>
      <SidebarSeparator className="mx-0 data-horizontal:w-full" />
      <SidebarFooter className="p-0">
        <AppSwitcher />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
