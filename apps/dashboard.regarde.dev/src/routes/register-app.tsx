import { createFileRoute } from "@tanstack/react-router";

import { RegisterAppPage } from "#register-app";

export const Route = createFileRoute("/register-app")({
  component: RouteComponent,
});

function RouteComponent(): React.ReactElement {
  return <RegisterAppPage />;
}
