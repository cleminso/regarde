import {
  Navigate,
  Outlet,
  createFileRoute,
  useMatch,
} from "@tanstack/react-router";

import { useMyRegardeAccount } from "#/lib/account/useMyRegardeAccount";

export const Route = createFileRoute("/app")({
  component: AppLayoutRoute,
});

function AppLayoutRoute(): React.ReactElement {
  const { myApps, isAccountReady, loadingState } = useMyRegardeAccount();

  // Check if we're at exactly /app (not a child route like /app/$appId/overview)
  const isAppRoot =
    useMatch({
      from: "/app",
      shouldThrow: false,
    })?.pathname === "/app";

  // Show loading while account data loads
  if (isAccountReady === false) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }

  // Handle error states
  if (loadingState === "unavailable" || loadingState === "unauthorized") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-semibold">Account Unavailable</h1>
        <p className="text-gray-600">Please try logging in again.</p>
      </div>
    );
  }

  // No apps - redirect to register-app
  if (myApps === undefined || myApps.length === 0) {
    return <Navigate to="/register-app" />;
  }

  // At /app root with apps - redirect to first app's overview
  if (isAppRoot) {
    const firstAppId = myApps[0].$jazz.id;
    return <Navigate to={`/app/${firstAppId}/overview`} />;
  }

  // Render outlet for child routes
  return <Outlet />;
}
