"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "#ui/sidebar";

import { AppSwitcher } from "#/components/navigation/appSwitcher";
import { NavMain } from "#/components/navigation/navMain";
import { NavUser } from "#/components/navigation/navUser";

export function SidebarNav(): React.ReactElement {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <AppSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
