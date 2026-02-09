import { createFileRoute, Navigate } from "@tanstack/react-router";

import { useRegardeAuth } from "@regarde-dev/core/react";

export const Route = createFileRoute("/app")({
  component: AppRoute,
});

function AppRoute() {
  const { state } = useRegardeAuth();

  const isSignedIn = state === "signedIn";

  if (isSignedIn === false) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to your Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your Regarde account is now active.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-lg font-semibold">Dashboard</h2>
          <p className="text-muted-foreground">
            Dashboard content will be added here.
          </p>
        </div>
      </div>
    </div>
  );
}
