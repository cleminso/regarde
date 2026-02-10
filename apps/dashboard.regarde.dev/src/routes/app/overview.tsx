import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/overview")({
  component: OverviewPage,
});

function OverviewPage(): React.ReactElement {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Overview</h1>
    </div>
  );
}
