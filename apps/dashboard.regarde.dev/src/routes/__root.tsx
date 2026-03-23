import { TanStackDevtools } from "@tanstack/react-devtools";
import { Outlet, createRootRoute, useLocation } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { DashboardLayout } from "#layout/dashboardLayout";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent(): React.ReactElement {
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith("/app/");

  const content = <Outlet />;

  if (isAppRoute) {
    return (
      <>
        <DashboardLayout>{content}</DashboardLayout>
        {/*<TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />*/}
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
