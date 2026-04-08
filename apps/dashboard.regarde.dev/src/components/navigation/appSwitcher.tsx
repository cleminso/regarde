"use client";

import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, Plus, Check } from "lucide-react";
import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@regarde/ui/dropdownMenu";
import {
  useMyRegardeAccount,
  type TRegardeApp,
} from "@regarde-dev/core/react";

/**
 * Placeholder component shown while the app switcher is loading.
 * Matches the shape of the actual switcher to prevent layout shift.
 */
function AppSwitcherPlaceholder(): React.ReactElement {
  return (
    <div className="group flex h-8 w-full items-center justify-start px-2 gap-2 overflow-hidden">
      {/* Icon box with subtle pulse */}
      <div className="flex h-5 w-5 items-center justify-center rounded-sm border border-border bg-secondary/50 shrink-0 animate-pulse" />

      {/* Text placeholder - hidden when collapsed */}
      <span className="flex-1 text-left group-data-[collapsible=icon]:hidden">
        <span className="block h-4 w-20 bg-secondary/50 rounded animate-pulse" />
      </span>

      {/* Chevron placeholder - hidden when collapsed */}
      <div className="h-3.5 w-3.5 shrink-0 group-data-[collapsible=icon]:hidden" />
    </div>
  );
}

export function AppSwitcher(): React.ReactElement {
  const navigate = useNavigate();
  const { account, myApps, selectedAppId, isReady } = useMyRegardeAccount({
    resolve: { myApps: { $each: true } },
  });

  const [activeApp, setActiveApp] = React.useState<TRegardeApp | null>(null);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (isReady && myApps && myApps.length > 0) {
      const currentApp = myApps.find(
        (app: TRegardeApp) => app.$jazz.id === selectedAppId,
      );
      setActiveApp(currentApp ?? myApps[0]);
    }
  }, [isReady, myApps, selectedAppId]);

  const handleSelect = (app: TRegardeApp): void => {
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

  // Show placeholder while account is loading
  if (account.$isLoaded === false) {
    return <AppSwitcherPlaceholder />;
  }

  // Show placeholder while SDK fields are loading
  if (isReady === false || myApps === null) {
    return <AppSwitcherPlaceholder />;
  }

  // Wait for activeApp to be set (find the current app in the list)
  // This also handles the edge case where selectedAppId doesn't match any app
  if (activeApp === null) {
    return <AppSwitcherPlaceholder />;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="group flex h-8 w-full hover:bg-secondary rounded-sm items-center justify-start px-2 gap-2 overflow-hidden transition-colors outline-none">
        <div className="flex h-5 w-5 items-center justify-center rounded-sm border border-border bg-secondary shrink-0">
          <span className="text-sm font-medium text-sidebar-foreground">
            {activeApp.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="truncate text-sm flex-1 text-left group-data-[collapsible=icon]:hidden">
          {activeApp.name}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 group-data-[collapsible=icon]:hidden" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--anchor-width)"
        align="start"
        side="top"
        sideOffset={4}
      >
        <div className="flex flex-col">
          {myApps.map((app: TRegardeApp) => (
            <DropdownMenuItem
              key={app.$jazz.id}
              onClick={() => handleSelect(app)}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-xs border border-sidebar-border bg-sidebar-accent shrink-0">
                <span className="text-sm font-medium text-sidebar-foreground">
                  {app.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="flex-1 truncate text-sm">{app.name}</span>
              {app.$jazz.id === activeApp.$jazz.id && (
                <Check className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleCreateApp}>
          <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground text-sm">Add app</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
