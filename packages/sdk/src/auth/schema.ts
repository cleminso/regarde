import { co, z } from "jazz-tools";

/**
 * -- TODO: Document (à fond) how to use; instance in a schema; load; what not to do...
 */
export const RegistrationKey = co
  .map({
    key: z.string(),
    expiresAt: z.number(),
  })
  .withMigration((registrationKey) => {
    if (!registrationKey.$jazz.has("key")) {
      registrationKey.$jazz.set("key", "not-valid-" + Math.random());
    }

    if (!registrationKey.$jazz.has("expiresAt")) {
      registrationKey.$jazz.set("expiresAt", 0);
    }
  });

export type RegistrationKeyLoaded = co.loaded<typeof RegistrationKey>;
