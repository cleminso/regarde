"use client";

import { useMemo } from "react";
import { useMatches, useParams } from "@tanstack/react-router";
import { LayoutDashboard, Webhook, Settings } from "lucide-react";

import { useMyRegardeAccount } from "@regarde-dev/core/react";

/**
 * Route definition for dashboard navigation.
 */
export interface TRoute {
  /** Unique identifier for the route */
  readonly id: string;
  /** Display title for the route */
  readonly title: string;
  /** Icon component (optional) */
  readonly icon?: React.ReactElement;
  /** Route link pattern - can include :appId placeholder */
  readonly link: string;
  /** Whether to show this route (can be boolean or function) */
  readonly if?: boolean | (() => boolean);
  /** Sub-routes for nested navigation */
  readonly subs?: TSubRoute[];
  /** Custom function to check if route is active */
  readonly checkIsActive?: (pathname: string, appId?: string) => boolean;
}

/**
 * Sub-route definition for nested navigation items.
 */
export interface TSubRoute {
  /** Display title for the sub-route */
  readonly title: string;
  /** Route link pattern */
  readonly link: string;
  /** Icon component (optional) */
  readonly icon?: React.ReactNode;
  /** Whether to show this sub-route */
  readonly if?: boolean | (() => boolean);
}

/**
 * Route with computed isActive flag.
 */
export interface TRouteWithActive extends TRoute {
  /** Whether this route is currently active */
  readonly isActive: boolean;
}

/**
 * Get all app routes for a given appId.
 * Returns route definitions with titles and patterns.
 */
export function getAppRoutes(appId?: string): TRoute[] {
  const baseRoute = appId ? `/app/${appId}` : "/app/:appId";

  return [
    {
      id: "overview",
      title: "Overview",
      icon: LayoutDashboard,
      link: `${baseRoute}/overview`,
      if: appId !== undefined,
      checkIsActive: (pathname: string, id?: string) => {
        if (id === undefined) return false;
        return pathname === `/app/${id}/overview` || pathname === `/app/${id}`;
      },
    },
    {
      id: "webhooks",
      title: "Webhooks",
      icon: Webhook,
      link: `${baseRoute}/webhooks`,
      if: appId !== undefined,
      checkIsActive: (pathname: string, id?: string) => {
        if (id === undefined) return false;
        return pathname.startsWith(`/app/${id}/webhooks`);
      },
    },
    {
      id: "settings",
      title: "Settings",
      icon: Settings,
      link: `${baseRoute}/settings`,
      if: appId !== undefined,
      checkIsActive: (pathname: string, id?: string) => {
        if (id === undefined) return false;
        return pathname.startsWith(`/app/${id}/settings`);
      },
    },
  ];
}

/**
 * Hook to get app routes with isActive flag computed from current pathname.
 */
export function useAppRoutes(): TRouteWithActive[] {
  const { appId } = useParams({ strict: false });
  const { account, isAccountReady, myApps } = useMyRegardeAccount({
    resolve: { myApps: { $each: true } },
  });
  const matches = useMatches();

  const effectiveAppId = useMemo(() => {
    if (appId !== undefined) return appId;
    if (account.$isLoaded === true && isAccountReady === true && myApps !== null && myApps.length > 0) {
      return myApps[0].$jazz.id;
    }
    return undefined;
  }, [appId, account.$isLoaded, isAccountReady, myApps]);

  const pathname = useMemo(() => {
    const lastMatch = matches[matches.length - 1];
    return lastMatch?.pathname ?? "";
  }, [matches]);

  const routes = useMemo(() => {
    return getAppRoutes(effectiveAppId);
  }, [effectiveAppId]);

  return useMemo(() => {
    return routes.map((route) => ({
      ...route,
      isActive: route.checkIsActive
        ? route.checkIsActive(pathname, effectiveAppId)
        : pathname.startsWith(route.link),
    }));
  }, [routes, pathname, effectiveAppId]);
}

/**
 * Hook to get the current active route.
 */
export function useCurrentRoute(): TRouteWithActive | undefined {
  const routes = useAppRoutes();
  return useMemo(() => {
    return routes.find((route) => route.isActive);
  }, [routes]);
}

/**
 * Hook to get page title from current route.
 * Returns the active route's title or "Dashboard" as fallback.
 */
export function usePageTitle(): string {
  const currentRoute = useCurrentRoute();
  return currentRoute?.title ?? "Dashboard";
}
