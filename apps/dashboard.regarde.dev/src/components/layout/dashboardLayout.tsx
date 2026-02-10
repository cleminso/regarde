import { MobileBottomNav } from "./mobileBottomNav";
import { SidebarNav } from "./sidebarNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({
  children,
}: DashboardLayoutProps): React.ReactElement {
  return (
    <div className="flex justify-center min-h-screen">
      <div className="w-full max-w-335 relative flex">
        <SidebarNav />
        <main className="flex-1 min-h-screen pb-16 md:pb-0">{children}</main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
