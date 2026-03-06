import { Separator } from "#ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "#ui/sidebar";

import { BreadcrumbNav } from "#/components/navigation/breadcrumbNav";
import { SidebarNav } from "./sidebarNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({
  children,
}: DashboardLayoutProps): React.ReactElement {
  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset>
        <div className="sticky top-0 z-10 flex h-10 items-center bg-sidebar-primary border-b border-sidebar-border">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <BreadcrumbNav />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-4  pt-0 overflow-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
