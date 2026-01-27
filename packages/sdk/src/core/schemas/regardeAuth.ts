import { co, z } from "jazz-tools";

import { generateRegardeToken } from "#managers/auth/generateToken";

/**
 * Authentication token for API requests.
 *
 * Stores 24-hour expiring token for stateless authentication.
 * Token is sent in headers (X-Regarde-Token, X-Regarde-Token-Id).
 *
 * @schema
 * - `token`: Authentication token string
 * - `expiresAt`: Unix timestamp when token expires
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

/** Loaded RegardeAuth instance */
export type TRegardeAuthLoaded = co.loaded<typeof RegardeAuth>;
