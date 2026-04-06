"use client";

import { cn } from "@regarde/ui/lib/utils";

interface DashboardBodyProps {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}

export function DashboardBody({
  children,
  className,
  // wide = true, // usage with wide data tables
}: DashboardBodyProps): React.ReactElement {
  return (
    <main
      className={cn(
        "flex-1 overflow-auto bg-card md:rounded-tl-xs",
        // wide ? "" : "w-full",
        className
      )}
    >
      {children}
    </main>
  );
}
