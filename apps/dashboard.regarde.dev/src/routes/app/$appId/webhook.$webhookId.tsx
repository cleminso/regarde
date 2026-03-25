import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/$appId/webhook/$webhookId")({
  component: RouteComponent,
});

function RouteComponent(): React.ReactElement {
  const { appId, webhookId } = Route.useParams();

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
