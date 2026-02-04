import "./index.css";

import { RouterProvider, createRouter } from "@tanstack/react-router";
import { JazzInspector } from "jazz-tools/inspector";
import { JazzReactProvider } from "jazz-tools/react";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { RegardeAccount } from "@regarde-dev/core";

import { apiKey } from "./lib/config/apiKey";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <JazzReactProvider
        AccountSchema={RegardeAccount}
        sync={{
          peer: `wss://cloud.jazz.tools/?key=${apiKey}`,
        }}
      >
        <RouterProvider router={router} />
        <JazzInspector position="bottom left" />
      </JazzReactProvider>
    </StrictMode>,
  );
}
