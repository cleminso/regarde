import { createFileRoute, useParams, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { usePaymentEvents } from "@regarde-dev/core/react";
import { Alert, AlertTitle, AlertDescription } from "#ui/alert";
import { Button } from "#ui/button";

export const Route = createFileRoute("/app/$appId/overview")({
  component: OverviewPage,
});

/**
 * Overview page with basic KPIs.
 *
 * @returns The overview page component
 */
interface LocationState {
  registered?: boolean;
  appName?: string;
}

function OverviewPage(): React.ReactElement {
  const { appId } = useParams({ strict: false });
  const location = useLocation();
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const locationState = location.state as LocationState | undefined;

  useEffect(() => {
    const isNewlyRegistered = locationState?.registered === true;
    if (isNewlyRegistered) {
      setShowSuccessAlert(true);

      const ALERT_DISMISS_MS = 5000;
      const timer = setTimeout(() => {
        setShowSuccessAlert(false);
      }, ALERT_DISMISS_MS);

      return () => clearTimeout(timer);
    }
  }, [locationState?.registered]);

  // Guard: appId is required
  if (appId === undefined || appId === "") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No app selected</p>
      </div>
    );
  }

  const { events: payments, isLoading: isLoadingPayments } = usePaymentEvents(
    appId,
    { mode: "all" },
  );

  const isLoading = isLoadingPayments;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Get recent events (last 5)
  const recentEvents = [...payments]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Overview</h1>

      {showSuccessAlert && (
        <div className="fixed bottom-4 right-4 z-50 w-80">
          <Alert className="shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <AlertTitle>
                  Successfully registered {locationState?.appName ?? "app"}
                </AlertTitle>
                <AlertDescription>
                  Setup your first webhook
                </AlertDescription>
              </div>
              <Button
                size="sm"
                variant="default"
                className="shrink-0"
                onClick={() => {
                  void Route.navigate({
                    to: "/app/$appId/settings",
                    params: { appId },
                  });
                }}
              >
                Configure
              </Button>
            </div>
          </Alert>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
        {recentEvents.length === 0 ? (
          <p className="text-muted-foreground">
            No recent activity. Webhooks will appear here when received.
          </p>
        ) : (
          <div className="space-y-2">
            {recentEvents.map((event) => (
              <div
                key={event.$jazz.id}
                className="flex items-center justify-between rounded border p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {event.amount} {event.currency.toUpperCase()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {event.status}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
