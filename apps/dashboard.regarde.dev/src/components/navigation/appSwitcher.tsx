"use client";

import { useNavigate } from "@tanstack/react-router";
import { ChevronsUpDown, GalleryVerticalEnd, Plus } from "lucide-react";
import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "#ui/sidebar";
import { useMyRegardeAccount, type TApp } from "#/lib/account/useMyRegardeAccount";

export function AppSwitcher(): React.ReactElement {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const { myApps, selectedAppId, isAccountReady } = useMyRegardeAccount();

  const [activeApp, setActiveApp] = React.useState<TApp | null>(null);

  React.useEffect(() => {
    if (isAccountReady && myApps && myApps.length > 0) {
      const currentApp = myApps.find((app: TApp) => app.$jazz.id === selectedAppId);
      setActiveApp(currentApp ?? myApps[0]);
    }
  }, [isAccountReady, myApps, selectedAppId]);

  const handleSelect = (app: TApp): void => {
    setActiveApp(app);
    navigate({
      to: "/app/$appId/overview",
      params: { appId: app.$jazz.id },
    });
  };

  const handleCreateApp = (): void => {
    navigate({ to: "/register-app" });
  };

  // Loading state
  if (isAccountReady === false || myApps === undefined || activeApp === null) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <GalleryVerticalEnd className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Loading apps...</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <GalleryVerticalEnd className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeApp.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {myApps.length} app{myApps.length !== 1 ? "s" : ""}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Your Apps
            </DropdownMenuLabel>
            {myApps.map((app: TApp) => (
              <DropdownMenuItem
                key={app.$jazz.id}
                onClick={() => handleSelect(app)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <GalleryVerticalEnd className="size-3.5 shrink-0" />
                </div>
                {app.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" onClick={handleCreateApp}>
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Add app</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
