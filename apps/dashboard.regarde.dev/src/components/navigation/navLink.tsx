"use client";

import { Link, useMatches } from "@tanstack/react-router";

import { cn } from "#lib/utils";

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function NavLink({
  to,
  children,
  onClick,
  disabled,
  className,
}: NavLinkProps): React.ReactElement {
  const matches = useMatches();
  const isActive = matches.some((match) => {
    const path = match.pathname;
    return path === to || path.startsWith(`${to}/`);
  });

  if (disabled) {
    return <span className="cursor-not-allowed opacity-50">{children}</span>;
  }

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "w-full",
        isActive && "*:bg-primary *:text-primary-foreground",
        className,
      )}
    >
      {children}
    </Link>
  );
}
