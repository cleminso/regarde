import { Outlet, createRootRoute, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { SidebarProvider } from "@regarde/ui/sidebar";
import { Toaster } from "@regarde/ui/sonner";

import { DashboardBody } from "#layout/dashboardBody";
import { DashboardLayout } from "#layout/dashboardLayout";
import { DashboardHeader } from "#layout/dashboardHeader";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent(): React.ReactElement {
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith("/app/");

  // Read sidebar state from cookie for persistence
  // Start with null to prevent flicker - don't render until we know the state
  const [defaultOpen, setDefaultOpen] = useState<boolean | null>(null);
  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("sidebar_state="));
    if (cookie) {
      const value = cookie.split("=")[1];
      setDefaultOpen(value !== "false");
    } else {
      setDefaultOpen(true); // Default to open if no cookie
    }
  }, []);

  // Don't render app layout until we've read the cookie (prevents flicker)
  if (isAppRoute && defaultOpen === null) {
    return (
      <div className="h-screen w-full bg-background-dashboard" />
    );
  }

  if (isAppRoute) {
    return (
      <SidebarProvider
        defaultOpen={defaultOpen}
        style={{
          "--sidebar-width": "14rem",
          "--sidebar-width-icon": "3.5rem"
        }}
      >
        <DashboardLayout>
          <DashboardHeader />
          <DashboardBody>
            <Outlet />
          </DashboardBody>
        </DashboardLayout>
        <Toaster position="bottom-right" />
      </SidebarProvider>
    );
  }

  return (
    <>
      <Outlet />
      <Toaster position="bottom-right" />
    </>
  );
}
