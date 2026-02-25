import { useCoState } from "jazz-tools/react";

import { App } from "#core/schemas/regardeUserApp";
import type { TApp } from "#core/schemas/regardeUserApp";

/**
 * Subscribe to a single App CoValue and ensure all event maps are loaded.
 *
 * @param appId - The Jazz CoValue ID of the App (starts with co_)
 * @returns The loaded App CoMap or null while loading
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const app = useRegardeApp("co_z123...");
 *   if (app === null) return <div>Loading...</div>;
 *   return <div>{app.name}</div>;
 * }
 * ```
 */
export function useRegardeApp(appId: string): TApp | null {
  return useCoState(App, appId, {
    resolve: {
      payments: { all: true, byUser: true },
      subscriptions: { all: true, byUser: true },
      licenses: { all: true, byUser: true },
    },
  });
}
