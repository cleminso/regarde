import { createFileRoute, Navigate } from "@tanstack/react-router";

import { useRegardeAuth } from "@regarde-dev/core/react";

export const Route = createFileRoute("/app")({
  component: AppRoute,
});

function AppRoute(): React.ReactElement | null {
  const { state } = useRegardeAuth();

  const isSignedIn = state === "signedIn";

  if (isSignedIn === false) {
    return <Navigate to="/" />;
  }

  return <Navigate to="/app/overview" />;
}
