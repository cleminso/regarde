"use client";

import { useNavigate } from "@tanstack/react-router";
import { ChevronsUpDown, Plus, Check } from "lucide-react";
import * as React from "react";

import { cn } from "@regarde/ui/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@regarde/ui/dropdownMenu";
import {
  useMyRegardeAccount,
  type TApp,
} from "#lib/account/useMyRegardeAccount";

export function AppSwitcher(): React.ReactElement {
  const navigate = useNavigate();
  const { myApps, selectedAppId, isAccountReady } = useMyRegardeAccount();

  const [activeApp, setActiveApp] = React.useState<TApp | null>(null);
  const [open, setOpen] = React.useState(false);

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
    setOpen(false);
    navigate({
      to: "/app/$appId/overview",
      params: { appId: app.$jazz.id },
    });
  };

  const handleCreateApp = (): void => {
    setOpen(false);
    navigate({ to: "/register-app" });
  };

  if (isAccountReady === false || myApps === undefined || activeApp === null) {
    return (
      <div className="flex h-10 items-center px-3 bg-primary border-b border-sidebar-border">
        <span className="text-sm text-sidebar-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="flex h-10 w-full items-center justify-between transition-colors outline-none">
        <div className="flex items-center gap-2 min-w-0 flex-1 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-5 w-5 items-center justify-center rounded-sm border border-sidebar-border bg-sidebar-accent shrink-0">
            <span className="text-sm font-medium text-sidebar-foreground">
              {activeApp.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="truncate group-data-[collapsible=icon]:hidden">
            {activeApp.name}
          </span>
        </div>
        <ChevronsUpDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 group-data-[collapsible=icon]:hidden"
          )}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--anchor-width)"
        align="start"
        side="top"
        sideOffset={4}
      >
        <div className="flex flex-col">
          {myApps.map((app: TApp) => (
            <DropdownMenuItem
              key={app.$jazz.id}
              onClick={() => handleSelect(app)}
            >
              <div className="flex h-5 w-5 items-center justify-center shrink-0">
                <span className="text-sm">
                  {app.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="flex-1 truncate">{app.name}</span>
              {app.$jazz.id === activeApp.$jazz.id && (
                <Check className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleCreateApp}>
          <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Add app</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
