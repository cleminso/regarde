import { co, z } from "jazz-tools";

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

    if (
      !registrationKey.$jazz.owner.getRoleOf("co_zoppoxWWJaHYKPgSgUkuCCXQX21")
    ) {
      console.log("Adding worker");
      co.group()
        .load("co_zoppoxWWJaHYKPgSgUkuCCXQX21")
        .then((jazzProfileWorkerGroup) => {
          if (!jazzProfileWorkerGroup) {
            console.debug("No public group");
            return;
          }

          registrationKey.$jazz.owner.addMember(
            jazzProfileWorkerGroup,
            "writer",
          );

          console.log("Regarde-dev worker added to Auth Token");
        });
    }
  });
