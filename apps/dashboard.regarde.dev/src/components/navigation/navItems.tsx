import { useParams } from "@tanstack/react-router";

import { NavLink } from "./navLink";

interface NavItemsProps {
  onNavigate?: () => void;
}

export function NavItems({ onNavigate }: NavItemsProps): React.ReactElement {
  const { appId } = useParams({ strict: false });

  const navItems = [
    { to: `/app/${appId}/overview`, label: "Overview" },
    { to: `/app/${appId}/payments`, label: "Payments" },
    { to: `/app/${appId}/settings`, label: "Settings" },
  ];

  return (
    <div className="space-y-1">
      {navItems.map((item) => (
        <NavLink key={item.to} to={item.to} onClick={onNavigate}>
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}
