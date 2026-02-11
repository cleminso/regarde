import { Navigate, createFileRoute, useParams } from "@tanstack/react-router";

import { useMyRegardeAccount } from "#/lib/account/useMyRegardeAccount";

export const Route = createFileRoute("/app/$appId/settings")({
  component: SettingsPage,
});

function SettingsPage(): React.ReactElement {
  const { selectedApp, isAccountReady, myApps } = useMyRegardeAccount();
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
        return <Navigate to="/app/$appId/settings" params={{ appId: firstAppId }} />;
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
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-2 text-gray-600">Configure {selectedApp?.name}</p>

      {selectedApp && (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold">App Details</h2>
            <dl className="mt-2 space-y-2">
              <div>
                <dt className="text-sm text-gray-500">Name</dt>
                <dd className="text-sm font-medium">{selectedApp.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Status</dt>
                <dd className="text-sm font-medium">
                  {selectedApp.isEnabled ? "Enabled" : "Disabled"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Payment Provider</dt>
                <dd className="text-sm font-medium capitalize">{selectedApp.paymentProvider}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
