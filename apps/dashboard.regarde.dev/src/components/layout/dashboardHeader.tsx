"use client";

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
    <header className="flex h-12 items-center justify-between bg-sidebar rounded-l-xs px-4">
      {customContent ?? (
        <nav className="flex items-center gap-2 text-sm">
          <span className="font-medium">{title}</span>
        </nav>
      )}
    </header>
  );
}
