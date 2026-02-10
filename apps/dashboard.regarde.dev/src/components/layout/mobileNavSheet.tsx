import { useNavigate } from "@tanstack/react-router";

import { useRegardeAuth } from "@regarde-dev/core/react";

import { Button } from "#/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "#/components/ui/sheet";

import { AppSelector } from "#/components/navigation/appSelector";
import { NavLink } from "#/components/navigation/navLink";

interface MobileNavSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNavSheet({
  open,
  onOpenChange,
}: MobileNavSheetProps): React.ReactElement {
  const { logOut } = useRegardeAuth();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    logOut();
    onOpenChange(false);
    navigate({ to: "/" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-75 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="font-bold text-lg">Regarde</SheetTitle>
        </SheetHeader>

        <div className="p-4">
          <AppSelector />

          <div className="border-t my-4" />

          <div className="space-y-1">
            <NavLink to="/app/overview" onClick={() => onOpenChange(false)}>
              Overview
            </NavLink>
            <NavLink to="/app/payments" onClick={() => onOpenChange(false)}>
              Payments
            </NavLink>
            <NavLink to="/app/settings" onClick={() => onOpenChange(false)}>
              Settings
            </NavLink>
          </div>

          <div className="border-t my-4" />

          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            Sign out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
