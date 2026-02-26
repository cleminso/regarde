"use client";

import { Link, useMatches, useParams } from "@tanstack/react-router";
import {
  ChevronRight,
  LayoutDashboard,
  Settings,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "#ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "#ui/sidebar";
import { useMyRegardeAccount } from "#/lib/account/useMyRegardeAccount";

interface NavMainProps {
  onNavigate?: () => void;
}

function isRouteActive(matches: ReturnType<typeof useMatches>, url: string): boolean {
  if (url === "#") return false;
  return matches.some((match) => {
    const path = match.pathname;
    return path === url || path.startsWith(`${url}/`);
  });
}

export function NavMain({ onNavigate }: NavMainProps): React.ReactElement {
  const { appId } = useParams({ strict: false });
  const { myApps, isAccountReady } = useMyRegardeAccount();
  const matches = useMatches();

  let effectiveAppId = appId;
  if (effectiveAppId === undefined && isAccountReady && myApps && myApps.length > 0) {
    effectiveAppId = myApps[0].$jazz.id;
  }

  const hasApp = effectiveAppId !== undefined;

  const overviewUrl = hasApp ? `/app/${effectiveAppId}/overview` : "#";
  const settingsUrl = hasApp ? `/app/${effectiveAppId}/settings` : "#";
  const paymentsUrl = hasApp ? `/app/${effectiveAppId}/payments` : "#";
  const subscriptionsUrl = hasApp ? `/app/${effectiveAppId}/subscriptions` : "#";
  const licensesUrl = hasApp ? `/app/${effectiveAppId}/licenses` : "#";

  const isOverviewActive = isRouteActive(matches, overviewUrl);
  const isSettingsActive = isRouteActive(matches, settingsUrl);
  const isPaymentsActive = isRouteActive(matches, paymentsUrl);
  const isSubscriptionsActive = isRouteActive(matches, subscriptionsUrl);
  const isLicensesActive = isRouteActive(matches, licensesUrl);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          {hasApp ? (
            <Link to={overviewUrl} onClick={onNavigate} className="w-full">
              <SidebarMenuButton asChild isActive={isOverviewActive} tooltip="Overview">
                <span className="flex items-center gap-2">
                  <LayoutDashboard className="size-4" />
                  <span>Overview</span>
                </span>
              </SidebarMenuButton>
            </Link>
          ) : (
            <SidebarMenuButton disabled tooltip="Overview">
              <LayoutDashboard className="size-4" />
              <span>Overview</span>
            </SidebarMenuButton>
          )}
        </SidebarMenuItem>

        <Collapsible defaultOpen className="group/collapsible">
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="Events">
                <span>Events</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                <SidebarMenuSubItem>
                  {hasApp ? (
                    <Link to={paymentsUrl} onClick={onNavigate}>
                      <SidebarMenuSubButton asChild isActive={isPaymentsActive}>
                        <span>Payments</span>
                      </SidebarMenuSubButton>
                    </Link>
                  ) : (
                    <SidebarMenuSubButton aria-disabled="true">
                      <span>Payments</span>
                    </SidebarMenuSubButton>
                  )}
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  {hasApp ? (
                    <Link to={subscriptionsUrl} onClick={onNavigate}>
                      <SidebarMenuSubButton asChild isActive={isSubscriptionsActive}>
                        <span>Subscriptions</span>
                      </SidebarMenuSubButton>
                    </Link>
                  ) : (
                    <SidebarMenuSubButton aria-disabled="true">
                      <span>Subscriptions</span>
                    </SidebarMenuSubButton>
                  )}
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  {hasApp ? (
                    <Link to={licensesUrl} onClick={onNavigate}>
                      <SidebarMenuSubButton asChild isActive={isLicensesActive}>
                        <span>Licenses</span>
                      </SidebarMenuSubButton>
                    </Link>
                  ) : (
                    <SidebarMenuSubButton aria-disabled="true">
                      <span>Licenses</span>
                    </SidebarMenuSubButton>
                  )}
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>

        <SidebarMenuItem>
          {hasApp ? (
            <Link to={settingsUrl} onClick={onNavigate} className="w-full">
              <SidebarMenuButton asChild isActive={isSettingsActive} tooltip="Settings">
                <span className="flex items-center gap-2">
                  <Settings className="size-4" />
                  <span>Settings</span>
                </span>
              </SidebarMenuButton>
            </Link>
          ) : (
            <SidebarMenuButton disabled tooltip="Settings">
              <Settings className="size-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
