import { Navigate, createFileRoute, useParams } from "@tanstack/react-router";

import { useMyRegardeAccount } from "#/lib/account/useMyRegardeAccount";

export const Route = createFileRoute("/app/$appId/overview")({
  component: OverviewPage,
});

function OverviewPage(): React.ReactElement {
  const { selectedApp, myUserHandle, isAccountReady, myApps } = useMyRegardeAccount();
  const params = useParams({ strict: false });
  const appId = params?.appId as string | undefined;

  // Loading state - account not ready yet
  if (isAccountReady === false) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }

  // Handle missing appId - redirect to first app if available
  if (appId === undefined) {
    const isAppsListLoaded = myApps?.$isLoaded === true;
    const hasApps = isAppsListLoaded && myApps.length > 0;
    
    if (hasApps) {
      const firstApp = myApps[0];
      const isFirstAppLoaded = firstApp?.$isLoaded === true;
      
      if (isFirstAppLoaded) {
        const firstAppId = firstApp.$jazz.id;
        return <Navigate to="/app/$appId/overview" params={{ appId: firstAppId }} />;
      }
    }

    // No apps or still loading - show spinner
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{selectedApp?.name ?? "Overview"}</h1>
      <p className="mt-2 text-gray-600">Welcome, {myUserHandle?.nickname ?? "User"}</p>
      {selectedApp?.description && <p className="mt-4 text-gray-700">{selectedApp.description}</p>}
    </div>
  );
}
