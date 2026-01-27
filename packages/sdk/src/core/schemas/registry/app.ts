import { co, z } from "jazz-tools";

import { App } from "#schemas/regardeUserApp";

/**
 * Registry-controlled metadata for an app.
 *
 * Managed by worker, references user-owned App CoMap.
 *
 * @schema
 * - `app`: Reference to App CoMap
 * - `isVerified`: Whether app is verified and accepting subscriptions
 * - `hasAccess`: Whether user has current access
 * - `webhookConfigured`: Whether webhook is configured for payments
 * - `createdAt`: When metadata was created
 * - `version`: Schema version for migration tracking
 */
export const RegistryAppMetadata = co.map({
  get app() {
    return App;
  },
  isVerified: z.boolean(),
  hasAccess: z.boolean(),
  webhookConfigured: z.boolean(),
  createdAt: z.number(),
  version: z.number(),
});

/** Loaded RegistryAppMetadata instance */
export type TRegistryAppMetadata = co.loaded<typeof RegistryAppMetadata>;

/** All apps in the registry, indexed by App ID */
export const AllRegistryAppsSchema = co.record(z.string(), RegistryAppMetadata);

/** Loaded AllRegistryAppsSchema instance */
export type TAllRegistryAppsSchema = co.loaded<typeof AllRegistryAppsSchema>;

/** Apps grouped by user, indexed by Jazz account ID */
export const AppsByUserRecord = co.record(
  z.string(),
  co.list(RegistryAppMetadata),
);

/** Loaded AppsByUserRecord instance */
export type TAppsByUserRecord = co.loaded<typeof AppsByUserRecord>;

/**
 * Registry of all applications.
 *
 * Indexes apps by user and maintains metadata.
 *
 * @schema
 * - `appsByUser`: Apps grouped by user owner
 * - `apps`: All apps indexed by App ID
 * - `metadata`: Additional registry data
 * - `registeredAt`: When registry was created
 * - `version`: Schema version for migration tracking
 */
export const AppRegistry = co.map({
  appsByUser: AppsByUserRecord,
  apps: AllRegistryAppsSchema,
  metadata: co.record(z.string(), z.string()),
  registeredAt: z.number(),
  version: z.number(),
});

/** Loaded AppRegistry instance */
export type TAppRegistry = co.loaded<typeof AppRegistry>;
