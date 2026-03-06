"use client";

import { Link, useMatches, useParams } from "@tanstack/react-router";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "#ui/sidebar";
import { useMyRegardeAccount } from "#/lib/account/useMyRegardeAccount";

interface NavMainProps {
  onNavigate?: () => void;
}

function isRouteActive(
  matches: ReturnType<typeof useMatches>,
  url: string,
): boolean {
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
  if (
    effectiveAppId === undefined &&
    isAccountReady &&
    myApps &&
    myApps.length > 0
  ) {
    effectiveAppId = myApps[0].$jazz.id;
  }

  const hasApp = effectiveAppId !== undefined;

  const overviewUrl = hasApp ? `/app/${effectiveAppId}/overview` : "#";
  const webhooksUrl = hasApp ? `/app/${effectiveAppId}/webhooks` : "#";
  const settingsUrl = hasApp ? `/app/${effectiveAppId}/settings` : "#";

  const isOverviewActive = isRouteActive(matches, overviewUrl);
  const isWebhooksActive = isRouteActive(matches, webhooksUrl);
  const isSettingsActive = isRouteActive(matches, settingsUrl);

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          {hasApp ? (
            <Link to={overviewUrl} onClick={onNavigate} className="w-full">
              <SidebarMenuButton isActive={isOverviewActive} tooltip="Overview">
                <span>Overview</span>
              </SidebarMenuButton>
            </Link>
          ) : (
            <SidebarMenuButton disabled tooltip="Overview">
              <span>Overview</span>
            </SidebarMenuButton>
          )}
        </SidebarMenuItem>

        <SidebarMenuItem>
          {hasApp ? (
            <Link to={webhooksUrl} onClick={onNavigate} className="w-full">
              <SidebarMenuButton isActive={isWebhooksActive} tooltip="Webhooks">
                <span>Webhooks</span>
              </SidebarMenuButton>
            </Link>
          ) : (
            <SidebarMenuButton disabled tooltip="Webhooks">
              <span>Webhooks</span>
            </SidebarMenuButton>
          )}
        </SidebarMenuItem>

        <SidebarMenuItem>
          {hasApp ? (
            <Link to={settingsUrl} onClick={onNavigate} className="w-full">
              <SidebarMenuButton isActive={isSettingsActive} tooltip="Settings">
                <span>Settings</span>
              </SidebarMenuButton>
            </Link>
          ) : (
            <SidebarMenuButton disabled tooltip="Settings">
              <span>Settings</span>
            </SidebarMenuButton>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
