import { Navigate, createFileRoute, useParams } from "@tanstack/react-router";

import { useMyRegardeAccount } from "#/lib/account/useMyRegardeAccount";

export const Route = createFileRoute("/app/$appId/payments")({
  component: PaymentsPage,
});

function PaymentsPage(): React.ReactElement {
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
  if (appId === undefined && myApps && myApps.length > 0) {
    const firstAppId = myApps[0].$jazz.id;
    return (
      <Navigate to="/app/$appId/payments" params={{ appId: firstAppId }} />
    );
  }

  const paymentIds =
    selectedApp?.payments?.$isLoaded === true
      ? Object.values(selectedApp.payments.all ?? {})
      : [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Payments</h1>
      <p className="mt-2 text-gray-600">
        {paymentIds.length} payments for {selectedApp?.name}
      </p>
      <p className="mt-1 text-sm text-gray-500">
        Payment Provider: {selectedApp?.paymentProvider ?? "N/A"}
      </p>
    </div>
  );
}
