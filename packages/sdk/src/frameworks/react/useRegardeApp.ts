import type { MaybeLoaded } from "jazz-tools";
import { useCoState } from "jazz-tools/react";

import { RegardeApp } from "#core/schemas/regardeUserApp";
import type { TRegardeApp } from "#core/schemas/regardeUserApp";

/**
 * Subscribe to a single App CoValue and ensure all event maps are loaded.
 *
 * @param appId - The Jazz CoValue ID of the App (starts with co_)
 * @returns The App CoMap with loading state information
 *
 * @example
 * ```tsx
 * function MyComponent({ appId }: { appId: string }) {
 *   const app = useRegardeApp(appId);
 *
 *   if (!app.$isLoaded) {
 *     switch (app.$jazz.loadingState) {
 *       case "loading":
 *         return <div>Loading app...</div>;
 *       case "unavailable":
 *         return <div>App not found</div>;
 *       case "unauthorized":
 *         return <div>You don't have access to this app</div>;
 *     }
 *   }
 *
 *   return <div>{app.name}</div>;
 * }
 * ```
 */
export function useRegardeApp(appId: string): MaybeLoaded<TRegardeApp> {
  return useCoState(RegardeApp, appId, {
    resolve: {
      webhooks: {
        $each: {
          events: true,
        },
      },
      payments: { all: true, byUser: true },
      subscriptions: { all: true, byUser: true },
      licenses: { all: true, byUser: true },
    },
  });
}
