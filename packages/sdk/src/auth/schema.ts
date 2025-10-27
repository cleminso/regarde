import { co, z } from "jazz-tools";

/**
 * -- TODO: Document (à fond) how to use; instance in a schema; load; what not to do...
 */
export const RegardeAuth = co
  .map({
    token: z.string(),
    expiresAt: z.number(),
  })
  .withMigration((regardeAuth) => {
    if (!regardeAuth.$jazz.has("token")) {
      regardeAuth.$jazz.set("token", "not-valid-" + Math.random());
    }

    if (!regardeAuth.$jazz.has("expiresAt")) {
      regardeAuth.$jazz.set("expiresAt", 0);
    }
  });

export type RegardeAuthLoaded = co.loaded<typeof RegardeAuth>;
