import { Navigate, createFileRoute } from "@tanstack/react-router";

import { AuthCard } from "#/components/auth/authCard";
import { useMyRegardeAccount } from "#/lib/account/useMyRegardeAccount";

export const Route = createFileRoute("/")({
  component: IndexRoute,
});

function IndexRoute(): React.ReactElement {
  const { isAccountReady, myApps } = useMyRegardeAccount();

  // Show landing page while loading
  if (isAccountReady === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <AuthCard />
      </div>
    );
  }

  // User has apps - redirect to first app's overview
  const isAppsListLoaded = myApps?.$isLoaded === true;
  const hasApps = isAppsListLoaded && myApps.length > 0;

  if (hasApps) {
    const firstApp = myApps[0];
    const isFirstAppLoaded = firstApp?.$isLoaded === true;

    if (isFirstAppLoaded) {
      const firstAppId = firstApp.$jazz.id;
      return (
        <Navigate to="/app/$appId/overview" params={{ appId: firstAppId }} />
      );
    }

    // App still loading - show spinner
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }

  // No apps - show landing page with auth
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <AuthCard />
    </div>
  );
}
