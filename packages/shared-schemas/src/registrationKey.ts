import { co, z } from "jazz-tools";

export const RegistrationKey = co
  .map({
    key: z.string(),
    expiresAt: z.number(),
  })
  .withMigration();
