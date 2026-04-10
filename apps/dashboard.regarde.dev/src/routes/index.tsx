import { Navigate, createFileRoute } from "@tanstack/react-router";

import { AuthCard } from "#auth/authCard";
import { useMyRegardeAccount } from "@regarde-dev/core/react";

export const Route = createFileRoute("/")({
  component: IndexRoute,
});

function IndexRoute(): React.ReactElement {
  const { account, isAccountReady, myApps } = useMyRegardeAccount({
    resolve: { myApps: { $each: true } },
  });

  if (account.$isLoaded === false) {
    switch (account.$jazz.loadingState) {
      case "loading":
        return (
          <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <AuthCard />
          </div>
        );
      case "unauthorized":
        return (
          <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <AuthCard />
          </div>
        );
      case "unavailable":
        return (
          <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <p className="text-destructive">Account unavailable</p>
          </div>
        );
    }
  }

  if (isAccountReady === true && myApps !== null && myApps.length > 0) {
    const firstAppId = myApps[0].$jazz.id;
    return (
      <Navigate to="/app/$appId/overview" params={{ appId: firstAppId }} />
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <AuthCard />
    </div>
  );
}
