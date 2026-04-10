import { Navigate, createFileRoute } from "@tanstack/react-router";

import { useRegardeApp } from "@regarde-dev/core/react";

export const Route = createFileRoute("/app/$appId/webhook/$webhookId")({
  component: RouteComponent,
});

function RouteComponent(): React.ReactElement {
  const { appId, webhookId } = Route.useParams();
  const app = useRegardeApp(appId);

  if (app.$isLoaded === false) {
    switch (app.$jazz.loadingState) {
      case "unauthorized":
        return <Navigate to="/" />;
      case "loading":
        return <div className="flex h-full items-center justify-center" />;
      case "unavailable":
        return (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-sm text-muted-foreground">App not found</p>
          </div>
        );
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-4">
      <h1 className="text-lg font-medium">Webhook Detail</h1>
      <p className="text-sm text-muted-foreground">
        App: {appId} | Webhook: {webhookId}
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Detail page coming soon...
      </p>
    </div>
  );
}
