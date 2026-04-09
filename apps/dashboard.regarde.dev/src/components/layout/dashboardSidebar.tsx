"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@regarde/ui/sidebar";
import { AppSwitcher } from "#navigation/appSwitcher";
import { DashboardNavigation } from "#navigation/dashboardNavigation";
import { cn } from "@regarde/ui/lib/utils";

function SidebarHeaderContent(): React.ReactElement {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className="flex flex-col py-2 gap-2">
      <div className={cn(
        "flex items-center gap-1",
        isCollapsed ? "flex-col gap-3.5" : "flex-row justify-between"
      )}>
        <AppSwitcher />
        <SidebarTrigger className="h-8 w-8 shrink-0 [&_svg:not([class*='size-'])]:size-4.5 hover:bg-sidebar-accent" />
      </div>
    </div>
  );
}

export function DashboardSidebar(): React.ReactElement {
  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="mt-1 border-none group-data-[collapsible=icon]:w-(--sidebar-width-icon)! *:data-[slot='sidebar-inner']:rounded-tr-xs"
    >
      <SidebarHeader className="p-0 px-2">
        <SidebarHeaderContent />
      </SidebarHeader>
      <SidebarContent>
        <DashboardNavigation />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
