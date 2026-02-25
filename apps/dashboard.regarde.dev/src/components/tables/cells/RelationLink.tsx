import { Link, useParams } from "@tanstack/react-router";

interface RelationLinkProps {
  type: "subscription" | "license";
  id?: string;
}

/**
 * Link to a related subscription or license.
 *
 * @returns The relation link component
 */
export function RelationLink({ type, id }: RelationLinkProps): React.ReactElement {
  const { appId } = useParams({ strict: false });

  // Guard: id is required
  if (id === undefined || id === null || id === "") {
    return <span>—</span>;
  }

  // Guard: appId is required
  if (appId === undefined || appId === "") {
    return <span>—</span>;
  }

  const truncatedId = id.substring(0, 8);

  // Use type-specific route paths that match registered routes
  const to = type === "subscription" 
    ? "/app/$appId/subscriptions" as const
    : "/app/$appId/licenses" as const;

  const searchParam =
    type === "subscription"
      ? { providerSubscriptionId: id }
      : { providerLicenseId: id };

  return (
    <Link
      to={to}
      params={{ appId }}
      search={searchParam}
      className="text-blue-600 hover:underline"
    >
      {truncatedId}...
    </Link>
  );
}
