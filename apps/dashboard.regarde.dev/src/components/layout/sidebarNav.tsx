import { useNavigate } from "@tanstack/react-router";

import { AppSelector } from "#/components/navigation/appSelector";
import { NavItems } from "#/components/navigation/navItems";
import { Button } from "#/components/ui/button";
import { useRegardeAuth } from "@regarde-dev/core/react";

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

      <NavItems />

      <div className="mt-auto pt-4 border-t">
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </nav>
  );
}
