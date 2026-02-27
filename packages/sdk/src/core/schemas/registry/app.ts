import { co, z } from "jazz-tools";

import { RegardeApp } from "#schemas/regardeUserApp";

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
export const RegardeRegistryAppMetadata = co.map({
  get app() {
    return RegardeApp;
  },
  isVerified: z.boolean(),
  hasAccess: z.boolean(),
  webhookConfigured: z.boolean(), // TODO: update to reflect RegardeUserApp data model change
  createdAt: z.number(),
  version: z.number(),
});

/** Loaded RegistryAppMetadata instance */
export type TRegardeRegistryAppMetadata = co.loaded<
  typeof RegardeRegistryAppMetadata
>;

/** All apps in the registry, indexed by App ID */
export const AllRegardeRegistryAppsSchema = co.record(
  z.string(),
  RegardeRegistryAppMetadata,
);

/** Loaded AllRegistryAppsSchema instance */
export type TAllRegistryAppsSchema = co.loaded<
  typeof AllRegardeRegistryAppsSchema
>;

/** Apps grouped by user, indexed by Jazz account ID */
export const RegardeAppsByUserRecord = co.record(
  z.string(),
  co.list(RegardeRegistryAppMetadata),
);

/** Loaded AppsByUserRecord instance */
export type TRegardeAppsByUserRecord = co.loaded<
  typeof RegardeAppsByUserRecord
>;

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
export const RegardeAppRegistry = co.map({
  appsByUser: RegardeAppsByUserRecord,
  apps: AllRegardeRegistryAppsSchema,
  metadata: co.record(z.string(), z.string()),
  registeredAt: z.number(),
  version: z.number(),
});

/** Loaded AppRegistry instance */
export type TRegardeAppRegistry = co.loaded<typeof RegardeAppRegistry>;
