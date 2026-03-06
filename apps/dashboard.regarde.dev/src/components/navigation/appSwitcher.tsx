"use client";

import { useNavigate } from "@tanstack/react-router";
import { ChevronsUpDown, GalleryVerticalEnd, Plus } from "lucide-react";
import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#ui/dropdown-menu";
import {
  useMyRegardeAccount,
  type TApp,
} from "#/lib/account/useMyRegardeAccount";

export function AppSwitcher(): React.ReactElement {
  const navigate = useNavigate();
  const { myApps, selectedAppId, isAccountReady } = useMyRegardeAccount();

  const [activeApp, setActiveApp] = React.useState<TApp | null>(null);

  React.useEffect(() => {
    if (isAccountReady && myApps && myApps.length > 0) {
      const currentApp = myApps.find(
        (app: TApp) => app.$jazz.id === selectedAppId,
      );
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

  if (isAccountReady === false || myApps === undefined || activeApp === null) {
    return (
      <div className="flex h-10 items-center px-3 bg-sidebar-primary border-b border-sidebar-border">
        <span className="text-sm text-sidebar-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex h-10 items-center px-3 bg-sidebar-primary border-b border-sidebar-border">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex-1 min-w-0 h-full w-full">
          <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:hidden px-2">
            <span className="text-sm text-sidebar-foreground truncate">
              {activeApp.name}
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 text-sidebar-foreground/60 shrink-0" />
          </div>
          <div className="hidden group-data-[collapsible=icon]:flex px-2 w-full justify-center">
            <GalleryVerticalEnd className="h-4 w-4" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 rounded-sm border-border"
          align="start"
          side="right"
          sideOffset={8}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Your Apps
            </DropdownMenuLabel>
            {myApps.map((app: TApp) => (
              <DropdownMenuItem
                key={app.$jazz.id}
                onClick={() => handleSelect(app)}
                className="gap-2 p-2 text-sm"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-sm border border-border">
                  <GalleryVerticalEnd className="h-3 w-3 shrink-0" />
                </div>
                {app.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 p-2" onClick={handleCreateApp}>
            <div className="flex h-5 w-5 items-center justify-center rounded-sm border border-border">
              <Plus className="h-3 w-3" />
            </div>
            <span className="text-sm text-muted-foreground">Add app</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
