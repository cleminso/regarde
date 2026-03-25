import { createFileRoute } from "@tanstack/react-router";

import { WebhooksListPage } from "#features/webhooks/pages/WebhooksListPage";

export const Route = createFileRoute("/app/$appId/webhooks")({
  component: RouteComponent,
});

function RouteComponent(): React.ReactElement {
  const { appId } = Route.useParams();
  return <WebhooksListPage appId={appId} />;
}
