import { Navigate, createFileRoute } from "@tanstack/react-router";

import { WebhooksPage } from "#webhooks";
import { useRegardeApp } from "@regarde-dev/core/react";

export const Route = createFileRoute("/app/$appId/webhooks")({
  component: RouteComponent,
});

function RouteComponent(): React.ReactElement {
  const { appId } = Route.useParams();
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

  return <WebhooksPage appId={appId} />;
}
