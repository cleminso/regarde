"use client";

import { Link, useMatches, useParams } from "@tanstack/react-router";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@regarde/ui/sidebar";
import { useMyRegardeAccount } from "#lib/account/useMyRegardeAccount";
import { getAppRoutes } from "#lib/navigation/appRoutes";

interface DashboardNavigationProps {
  onNavigate?: () => void;
}

export function DashboardNavigation({ onNavigate }: DashboardNavigationProps): React.ReactElement {
  const { appId } = useParams({ strict: false });
  const { myApps, isAccountReady } = useMyRegardeAccount();
  const matches = useMatches();

  // Determine effective appId
  let effectiveAppId = appId;
  if (
    effectiveAppId === undefined &&
    isAccountReady &&
    myApps &&
    myApps.length > 0
  ) {
    effectiveAppId = myApps[0].$jazz.id;
  }

  // Get routes from centralized definition
  const routes = getAppRoutes(effectiveAppId);

  // Filter to only show enabled routes
  const visibleRoutes = routes.filter((route) => {
    if (typeof route.if === "boolean") return route.if;
    if (typeof route.if === "function") return route.if();
    return true;
  });

  const pathname = matches[matches.length - 1]?.pathname ?? "";

  return (
    <SidebarGroup className="px-2 py-1.5">
      <SidebarMenu className="gap-0.5">
        {visibleRoutes.map((route) => {
          const isActive = route.checkIsActive
            ? route.checkIsActive(pathname, effectiveAppId)
            : pathname.startsWith(route.link);

          const isDisabled = effectiveAppId === undefined || route.link.includes(":appId");

          const IconComponent = route.icon;

          return (
            <SidebarMenuItem key={route.id}>
              {isDisabled ? (
                <SidebarMenuButton disabled tooltip={route.title} lassName="disabled:text-muted-foreground disabled:opacity-40 disabled:hover:bg-transparent text-base rounded-none px-1 md:group-data-[collapsible=icon]:rounded-xs">
                  {IconComponent && <IconComponent />}
                  <span>{route.title}</span>
                </SidebarMenuButton>
              ) : (
                <Link to={route.link} onClick={onNavigate}>
                  <SidebarMenuButton isActive={isActive} tooltip={route.title} className="focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-sidebar-ring focus-visible:ring-offset-0 data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:hover:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary active:bg-transparent active:text-sidebar-foreground text-sidebar-accent-foreground hover:bg-secondary hover:text-sidebar-accent-foreground text-sm rounded-xs px-2 md:group-data-[collapsible=icon]:rounded-xs">
                    {IconComponent && <IconComponent />}
                    <span>{route.title}</span>
                  </SidebarMenuButton>
                </Link>
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
