import { createFileRoute } from "@tanstack/react-router";

import { WebhooksPage } from "#webhooks";

export const Route = createFileRoute("/app/$appId/webhooks")({
  component: RouteComponent,
});

function RouteComponent(): React.ReactElement {
  const { appId } = Route.useParams();
  return <WebhooksPage appId={appId} />;
}
