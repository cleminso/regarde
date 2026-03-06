// Settings page for app configuration
// FEATURE: App Settings

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/$appId/settings")({
  component: SettingsPage,
});

function SettingsPage(): React.ReactElement {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="font-mono text-sm text-muted-foreground">Settings page</p>
    </div>
  );
}
