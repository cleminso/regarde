"use client";

import { Moon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "#ui/sidebar";
import { Button } from "#ui/button";

import { AppSwitcher } from "#navigation/appSwitcher";
import { NavMain } from "#navigation/navMain";

export function SidebarNav(): React.ReactElement {
  return (
    <Sidebar layout="flex" collapsible="icon" className="h-full">
      <SidebarHeader className="px-2 py-2">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
          <div className="h-5 w-5 group-data-[collapsible=icon]:hidden" />

          <div className="flex items-center gap-1 group-data-[collapsible=icon]:flex-col-reverse">
            <Button variant="ghost" size="icon-sm" >
              <Moon />
            </Button>
            <SidebarTrigger/>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-2">
        <NavMain />
        <SidebarGroup className="mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Share feedback">
                  <span>Share feedback</span>
                </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <a
                href="https://docs.regarde.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <SidebarMenuButton tooltip="Documentation">
                  <span>Documentation</span>
                </SidebarMenuButton>
              </a>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 py-2">
        <AppSwitcher />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
