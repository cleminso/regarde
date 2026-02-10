import { Link, useMatches } from "@tanstack/react-router";

import { cn } from "#/lib/utils";

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function NavLink({ to, children, onClick }: NavLinkProps): React.ReactElement {
  const matches = useMatches();
  const isActive = matches.some((match) => {
    const path = match.pathname;
    return path === to || path.startsWith(`${to}/`);
  });

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {children}
    </Link>
  );
}
