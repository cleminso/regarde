"use client";

import { SidebarTrigger } from "@regarde/ui/sidebar";
import { usePageTitle } from "#lib/navigation/appRoutes";

interface DashboardHeaderProps {
  title?: string;
  customContent?: React.ReactNode;
}

export function DashboardHeader({
  title: customTitle,
  customContent,
}: DashboardHeaderProps): React.ReactElement {
  const pageTitle = usePageTitle();
  const title = customTitle ?? pageTitle;
  return (
    <header className="flex h-12 items-center justify-between bg-sidebar rounded-l-xs px-2">
      {customContent ?? (
        <nav className="flex items-center gap-2 text-sm">
          <SidebarTrigger className="h-8 w-8 shrink-0 [&_svg:not([class*='size-'])]:size-4.5 hover:bg-sidebar-accent" />
          <span className="font-medium">{title}</span>
        </nav>
      )}
    </header>
  );
}
