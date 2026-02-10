import { useNavigate } from "@tanstack/react-router";

import { useRegardeAuth } from "@regarde-dev/core/react";

import { Button } from "#/components/ui/button";

import { AppSelector } from "#/components/navigation/appSelector";
import { NavLink } from "#/components/navigation/navLink";

export function SidebarNav(): React.ReactElement {
  const { logOut } = useRegardeAuth();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    logOut();
    navigate({ to: "/" });
  };

  return (
    <nav className="hidden md:flex md:sticky md:top-0 md:h-screen md:w-60 flex-col px-4 py-6 bg-background">
      <div className="font-bold text-xl mb-6">Regarde</div>

      <div className="mb-6">
        <AppSelector />
      </div>

      <div className="space-y-1 flex-1">
        <NavLink to="/app/overview">Overview</NavLink>
        <NavLink to="/app/payments">Payments</NavLink>
        <NavLink to="/app/settings">Settings</NavLink>
      </div>

      <div className="mt-auto pt-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          Sign out
        </Button>
      </div>
    </nav>
  );
}
