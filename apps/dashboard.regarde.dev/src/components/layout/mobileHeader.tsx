"use client";

import { SidebarTrigger } from "@regarde/ui/sidebar";

export function MobileHeader(): React.ReactElement {
  return (
    <div className="sticky top-0 z-50 flex w-full items-center justify-between bg-sidebar p-2 md:hidden">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary">
        <span className="sr-only">Logo</span>
      </div>

      <div className="flex items-center gap-4">
        <SidebarTrigger />
      </div>
    </div>
  );
}
