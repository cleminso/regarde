import { useParams } from "@tanstack/react-router";

import { useMyRegardeAccount } from "#/lib/account/useMyRegardeAccount";

import { NavLink } from "./navLink";

interface NavItemsProps {
  onNavigate?: () => void;
}

export function NavItems({ onNavigate }: NavItemsProps): React.ReactElement {
  const { appId } = useParams({ strict: false });
  const { myApps, isAccountReady } = useMyRegardeAccount();

  // Determine which appId to use - from URL or first available app
  let effectiveAppId = appId;
  if (effectiveAppId === undefined && isAccountReady && myApps) {
    const hasApps = myApps.length > 0;
    if (hasApps) {
      effectiveAppId = myApps[0].$jazz.id;
    }
  }

  // If no appId available, show disabled placeholder
  if (effectiveAppId === undefined) {
    return (
      <div className="space-y-1">
        <div className="px-3 py-2 text-sm text-muted-foreground">Overview</div>
        <div className="px-3 py-2 text-sm text-muted-foreground">Payments</div>
        <div className="px-3 py-2 text-sm text-muted-foreground">Subscriptions</div>
        <div className="px-3 py-2 text-sm text-muted-foreground">Licenses</div>
        <div className="px-3 py-2 text-sm text-muted-foreground">Settings</div>
      </div>
    );
  }

  const navItems = [
    { to: `/app/${effectiveAppId}/overview`, label: "Overview" },
    { to: `/app/${effectiveAppId}/payments`, label: "Payments" },
    { to: `/app/${effectiveAppId}/subscriptions`, label: "Subscriptions" },
    { to: `/app/${effectiveAppId}/licenses`, label: "Licenses" },
    { to: `/app/${effectiveAppId}/settings`, label: "Settings" },
  ];

  return (
    <div className="space-y-1">
      {navItems.map((item) => (
        <NavLink key={item.to} to={item.to} onClick={onNavigate}>
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}
