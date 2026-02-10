import { Menu } from "lucide-react";
import * as React from "react";

import { Button } from "#/components/ui/button";

import { MobileNavSheet } from "./mobileNavSheet";

const NAV_ITEMS = [
  { to: "/app/overview", label: "Overview" },
  { to: "/app/payments", label: "Payments" },
  { to: "/app/settings", label: "Settings" },
];

export function MobileBottomNav(): React.ReactElement {
  const [sheetOpen, setSheetOpen] = React.useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background md:hidden">
        <div className="flex h-full items-center justify-around px-4">
          {NAV_ITEMS.map((item) => (
            <MobileNavButton key={item.to} to={item.to} label={item.label} />
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
  to: string;
  label: string;
}

function MobileNavButton({ to, label }: MobileNavButtonProps): React.ReactElement {
  const isActive = typeof window !== "undefined" && window.location.pathname === to;

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`flex flex-col items-center gap-1 h-auto py-2 ${
        isActive ? "text-primary font-medium" : "text-muted-foreground"
      }`}
      asChild
    >
      <a href={to}>
        <span className="text-xs">{label}</span>
      </a>
    </Button>
  );
}
