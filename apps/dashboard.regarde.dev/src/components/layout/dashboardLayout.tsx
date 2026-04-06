import { DashboardSidebar } from "./dashboardSidebar";
import { MobileHeader } from "./mobileHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps): React.ReactElement {
  return (
    <div className="flex min-h-svh w-full flex-col bg-background-dashboard gap-1 md:flex-row md:pt-1">
      <MobileHeader />

      <div className="hidden md:flex [&:has(>[data-slot='sidebar'][data-state='collapsed'])>[data-slot='sidebar']>[data-slot='sidebar-gap']]:w-(--sidebar-width-icon)!">
        <DashboardSidebar />
      </div>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-1">
        {children}
      </div>
    </div>
  );
}
