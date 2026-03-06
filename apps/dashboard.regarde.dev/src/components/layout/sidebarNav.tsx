"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "#ui/sidebar";

import { AppSwitcher } from "#/components/navigation/appSwitcher";
import { NavMain } from "#/components/navigation/navMain";

export function SidebarNav(): React.ReactElement {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <AppSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
