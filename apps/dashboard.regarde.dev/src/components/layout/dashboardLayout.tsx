import { SidebarProvider, SidebarTrigger } from "#ui/sidebar";

import { BreadcrumbNav } from "#navigation/breadcrumbNav";
import { SidebarNav } from "./sidebarNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({
  children,
}: DashboardLayoutProps): React.ReactElement {
  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full flex-col md:hidden">
        {/* Mobile header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4">
          <div className="h-5 w-5 bg-[#EBEDF3]" />
          <SidebarTrigger />
        </header>

        {/* Mobile main content */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b bg-card px-4 py-3">
            <BreadcrumbNav />
          </div>
          <div className="flex-1 overflow-auto bg-card p-4">{children}</div>
        </main>

        <SidebarNav />
      </div>

      <div className="hidden h-screen w-full bg-border pt-1 md:block">
        <div className="flex h-full gap-1">
          <SidebarNav />

          {/* Main content area */}
          <main className="flex flex-1 flex-col gap-1 overflow-hidden rounded-tl-xs">
            <header className="flex items-center gap-2 rounded-bl-xs bg-card px-2 py-2">
              <BreadcrumbNav />
            </header>

            <div className="flex-1 overflow-auto rounded-tl-xs bg-card p-4">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
