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
export const RegardeTokenAuth = co
  .map({
    token: z.string(),
    expiresAt: z.number(),
  })
  .withMigration((regardeTokenAuth) => {
    if (!regardeTokenAuth.$jazz.has("token")) {
      regardeTokenAuth.$jazz.set("token", generateRegardeToken());
    }

    if (!regardeTokenAuth.$jazz.has("expiresAt")) {
      regardeTokenAuth.$jazz.set("expiresAt", 0);
    }
  });

/** Loaded RegardeTokenAuth instance */
export type TRegardeAuthLoaded = co.loaded<typeof RegardeTokenAuth>;
