import { Link, useParams } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import * as React from "react";

import { Button } from "#/components/ui/button";
import { useMyRegardeAccount } from "#/lib/account/useMyRegardeAccount";

import { MobileNavSheet } from "./mobileNavSheet";

export function MobileBottomNav(): React.ReactElement {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const { appId } = useParams({ strict: false });
  const { myApps, isAccountReady } = useMyRegardeAccount();

  // Determine which appId to use - from URL or first available app
  let effectiveAppId = appId;
  if (effectiveAppId === undefined && isAccountReady && myApps && myApps.length > 0) {
    effectiveAppId = myApps[0].$jazz.id;
  }

  const navItems = [
    { to: "/app/$appId/overview" as const, label: "Overview" },
    { to: "/app/$appId/payments" as const, label: "Payments" },
    { to: "/app/$appId/settings" as const, label: "Settings" },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background md:hidden">
        <div className="flex h-full items-center justify-around px-4">
          {navItems.map((item) => (
            <MobileNavButton key={item.to} to={item.to} label={item.label} appId={effectiveAppId} />
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => setSheetOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="text-xs">More</span>
          </Button>
        </div>
      </nav>
      <MobileNavSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}

interface MobileNavButtonProps {
  to: "/app/$appId/overview" | "/app/$appId/payments" | "/app/$appId/settings";
  label: string;
  appId: string | undefined;
}

function MobileNavButton({ to, label, appId }: MobileNavButtonProps): React.ReactElement {
  if (!appId) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="flex flex-col items-center gap-1 h-auto py-2 text-muted-foreground"
      >
        <span className="text-xs">{label}</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex flex-col items-center gap-1 h-auto py-2"
      asChild
    >
      <Link
        to={to}
        params={{ appId }}
        activeProps={{ className: "text-primary font-medium" }}
        inactiveProps={{ className: "text-muted-foreground" }}
      >
        <span className="text-xs">{label}</span>
      </Link>
    </Button>
  );
}
