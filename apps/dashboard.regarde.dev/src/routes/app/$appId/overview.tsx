// Overview page for app dashboard
// FEATURE: App Overview

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/$appId/overview")({
  component: OverviewPage,
});

function OverviewPage(): React.ReactElement {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="font-mono text-sm text-muted-foreground">Overview page</p>
    </div>
  );
}
