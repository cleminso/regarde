import { co, z } from "jazz-tools";
import { generateRegardeToken } from "#managers/auth/generateToken";

/**
 * # RegardeAuth - Provides temporary authentication tokens for API requests
 *
 * ## Purpose
 * - Stores 24-hour expiring tokens for stateless API authentication
 * - Stored in account.root["api.regarde.dev"]
 *
 * ## Flow
 * 1. SDK generates token via RegardeAuth hook
 * 2. Client sends token to server in headers: X-Regarde-Token, X-Regarde-Token-Id
 * 3. Worker loads RegardeAuth CoMap using token ID (has write permission)
 * 4. Worker verifies user owns token (no session storage needed)
 *
 * ## Migration
 * - User adds worker (set via REGARDE_REGISTRY_GROUP environment variable) with "writer" permissions
 * - Worker requires write access to validate token ownership during API
 */
/**
 * Temporary authentication tokens for API requests
 *
 * - token - Authentication token for API requests
 *
 * - expiresAt - Unix timestamp when token expires
 */
export const RegardeAuth = co
  .map({
    token: z.string(),
    expiresAt: z.number(),
  })
  .withMigration((regardeAuth) => {
    if (!regardeAuth.$jazz.has("token")) {
      regardeAuth.$jazz.set("token", generateRegardeToken());
    }

    if (!regardeAuth.$jazz.has("expiresAt")) {
      regardeAuth.$jazz.set("expiresAt", 0);
    }
  });

export type TRegardeAuthLoaded = co.loaded<typeof RegardeAuth>;
