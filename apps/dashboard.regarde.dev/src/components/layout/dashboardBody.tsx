"use client";

import { cn } from "@regarde/ui/lib/utils";

interface DashboardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardBody({
  children,
  className,
}: DashboardBodyProps): React.ReactElement {
  return (
    <main
      className={cn(
        "flex-1 overflow-auto md:rounded-tl-xs",
        className
      )}
    >
      {children}
    </main>
  );
}
