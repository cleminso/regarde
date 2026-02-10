import { TanStackDevtools } from "@tanstack/react-devtools";
import { Outlet, createRootRoute, useMatch } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { DashboardLayout } from "#/components/layout/dashboardLayout";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent(): React.ReactElement {
  const isAppRoute = useMatch({
    from: "/app",
    shouldThrow: false,
  });

  const content = <Outlet />;

  if (isAppRoute !== undefined) {
    return (
      <>
        <DashboardLayout>{content}</DashboardLayout>
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
      </>
    );
  }

  return (
    <>
      {content}
      <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "Tanstack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </>
  );
}
