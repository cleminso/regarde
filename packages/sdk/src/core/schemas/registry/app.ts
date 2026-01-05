import { App } from "#schemas/regardeUserApp";
import { co, z } from "jazz-tools";

/**
 * Represents an application controlled by the app owner
 *
 * - name - Human-readable application name
 * - description - Application description and purpose
 * - ownerAccountId - Jazz Account ID of the app owner
 * - paymentProvider - Payment provider handling subscriptions
 * - providerAppId - Provider-specific application identifier
 * - isEnabled - Can this app accept payments?
 * - createdAt - Unix timestamp when app was registered
 * - metadata - Additional app configuration data
 * - webhookSecret -
 * - payments - When last successful payment received
 */

/**
 * Registry-controlled metadata for an application
 *
 * - appId - Reference to the App CoValue
 * - isVerified - Whether app is verified and accepting subscriptions
 * - hasAccess - Does user have access right now?
 * - webhookConfigured - Whether webhook is set up for payment processing
 * - createdAt - When Regarde created this metadata record
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
export type TRegistryAppMetadata = co.loaded<typeof RegistryAppMetadata>;

/**
 * Collection of all apps in the registry
 */
export const AllRegistryAppsSchema = co.record(z.string(), RegistryAppMetadata);
export type TAllRegistryAppsSchema = co.loaded<typeof AllRegistryAppsSchema>;

/**
 * Collection of apps grouped by user
 */
export const AppsByUserRecord = co.record(
  z.string(),
  co.list(RegistryAppMetadata),
);
export type TAppsByUserRecord = co.loaded<typeof AppsByUserRecord>;

/**
 * Registry of all applications and their metadata
 *
 * - apps - Mapping of app IDs to app definitions owned by developers
 * - metadata - Registry-controlled metadata for each app
 * - registeredAt - Unix timestamp when registry was created
 * - version - Schema version for migration tracking
 */
export const AppRegistry = co.map({
  // All apps for 1 user
  appsByUser: AppsByUserRecord,
  // All apps in registry, 1 per AppId
  apps: AllRegistryAppsSchema,
  metadata: co.record(z.string(), z.string()),
  registeredAt: z.number(),
  version: z.number(),
});
export type TAppRegistry = co.loaded<typeof AppRegistry>;
