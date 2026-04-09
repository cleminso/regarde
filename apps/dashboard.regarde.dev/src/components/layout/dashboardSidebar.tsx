"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarRail,
} from "@regarde/ui/sidebar";
import { AppSwitcher } from "#navigation/appSwitcher";
import { DashboardNavigation } from "#navigation/dashboardNavigation";

export function DashboardSidebar(): React.ReactElement {
  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="mt-1 border-none group-data-[collapsible=icon]:w-(--sidebar-width-icon)! *:data-[slot='sidebar-inner']:rounded-tr-xs"
    >
      <SidebarHeader className="p-0 px-2">
        <div className="flex flex-col py-2 gap-2">
          <AppSwitcher />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <DashboardNavigation />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
