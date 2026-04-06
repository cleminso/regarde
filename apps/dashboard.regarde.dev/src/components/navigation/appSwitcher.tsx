"use client";

import { motion } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronsUpDown, Plus, Check } from "lucide-react";
import * as React from "react";


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@regarde/ui/dropdownMenu";
import { useSidebar } from "@regarde/ui/sidebar";
import {
  useMyRegardeAccount,
  type TApp,
} from "#lib/account/useMyRegardeAccount";

export function AppSwitcher(): React.ReactElement {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
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
      <DropdownMenuTrigger className="flex h-12 w-full hover:bg-secondary px-3 items-center justify-between transition-colors outline-none">
        <div className="flex items-center min-w-0 flex-1 justify-start">
          <motion.div
            className="shrink-0"
            initial={false}
            animate={{
              width: isCollapsed ? 6 : 0,
            }}
            transition={{ duration: 0.2 }}
          />
          <div className="flex h-5 w-5 items-center justify-center rounded-sm border border-border bg-secondary shrink-0">
            <span className="text-sm font-medium text-sidebar-foreground">
              {activeApp.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <motion.span
            className="truncate text-sm ml-2"
            initial={false}
            animate={{
              opacity: isCollapsed ? 0 : 1,
              width: isCollapsed ? 0 : "auto",
            }}
            transition={{ duration: 0.2 }}
          >
            {activeApp.name}
          </motion.span>
        </div>
        <motion.div
          initial={false}
          animate={{
            opacity: isCollapsed ? 0 : 1,
            width: isCollapsed ? 0 : "auto",
          }}
          transition={{ duration: 0.2 }}
        >
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0" />
        </motion.div>
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
