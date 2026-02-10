import { Navigate, Outlet, createFileRoute } from "@tanstack/react-router";

import { useMyRegardeAccount } from "#/lib/account/useMyRegardeAccount";

export const Route = createFileRoute("/app/$appId")({
  component: AppIdLayoutRoute,
});

function AppIdLayoutRoute(): React.ReactElement {
  const { myApps, isAccountReady, selectedApp } = useMyRegardeAccount();

  // Wait for account to be ready
  if (isAccountReady === false || myApps === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }

  // If selectedApp is undefined, the appId from URL was invalid
  // Redirect to first available app
  if (selectedApp === undefined) {
    const firstAppId = myApps[0].$jazz.id;
    return <Navigate to={`/app/${firstAppId}/overview`} replace />;
  }

  // Valid app - render child routes with app context
  return <Outlet />;
}
