import { createFileRoute } from "@tanstack/react-router";

import { AuthCard } from "#/components/auth/authCard";

export const Route = createFileRoute("/")({
  component: IndexRoute,
});

function IndexRoute() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <AuthCard />
    </div>
  );
}
