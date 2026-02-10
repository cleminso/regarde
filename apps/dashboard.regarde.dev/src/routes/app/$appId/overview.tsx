import { createFileRoute } from "@tanstack/react-router";

import { useMyRegardeAccount } from "#/lib/account/useMyRegardeAccount";

export const Route = createFileRoute("/app/$appId/overview")({
  component: OverviewPage,
});

function OverviewPage(): React.ReactElement {
  const { selectedApp, myUserHandle } = useMyRegardeAccount();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{selectedApp?.name ?? "Overview"}</h1>
      <p className="mt-2 text-gray-600">
        Welcome, {myUserHandle?.nickname ?? "User"}
      </p>
      {selectedApp?.description && (
        <p className="mt-4 text-gray-700">{selectedApp.description}</p>
      )}
    </div>
  );
}
