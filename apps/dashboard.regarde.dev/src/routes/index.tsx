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
  if (myApps && myApps.length > 0) {
    const firstAppId = myApps[0].$jazz.id;
    return (
      <Navigate to="/app/$appId/overview" params={{ appId: firstAppId }} />
    );
  }

  // No apps - show landing page with auth
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <AuthCard />
    </div>
  );
}
