"use client";

import { useLocation, useParams } from "@tanstack/react-router";

import { Breadcrumb } from "@regarde/ui/components/atoms/Breadcrumb";
import {
  useMyRegardeAccount,
  type TApp,
} from "#lib/account/useMyRegardeAccount";

function getPageLabelFromPathname(pathname: string): string {
  const segments = pathname.split("/");
  const lastSegment = segments[segments.length - 1];

  switch (lastSegment) {
    case "overview":
      return "Overview";
    case "subscriptions":
    case "webhooks":
      return "Webhooks";
    case "settings":
      return "Settings";
    default:
      return "Overview";
  }
}

export function BreadcrumbNav(): React.ReactElement {
  const { appId } = useParams({ strict: false });
  const location = useLocation();
  const { myApps, isAccountReady } = useMyRegardeAccount();

  // Determine effective app
  let effectiveAppId = appId;
  let effectiveApp: TApp | null = null;

  if (isAccountReady && myApps) {
    if (effectiveAppId) {
      effectiveApp =
        myApps.find((app: TApp) => app.$jazz.id === effectiveAppId) ?? null;
    }
    const appFound = effectiveApp !== null;
    if (appFound === false && myApps.length > 0) {
      const firstApp = myApps[0];
      effectiveApp = firstApp;
      effectiveAppId = firstApp.$jazz.id;
    }
  }

  // Get current page label from reactive location
  const pageLabel = effectiveAppId
    ? getPageLabelFromPathname(location.pathname)
    : "Overview";

  // Loading state check with explicit boolean pattern
  const appReady = effectiveApp !== null;
  if (isAccountReady === false || appReady === false) {
    return (
      <Breadcrumb.Root>
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Page>Loading...</Breadcrumb.Page> // TODO: avoid loading at each page refresh
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>
    );
  }

  // TypeScript guard: effectiveApp is guaranteed to be non-null here
  if (effectiveApp === null) {
    throw new Error(
      "Unexpected: effectiveApp should not be null after guard check",
    );
  }

  return (
    <Breadcrumb.Root>
      <Breadcrumb.List>
        <Breadcrumb.Item>
          <Breadcrumb.Page>{pageLabel}</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb.List>
    </Breadcrumb.Root>
  );
}
