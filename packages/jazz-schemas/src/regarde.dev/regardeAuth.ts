import { co, z } from "jazz-tools";

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

    if (!regardeAuth.$jazz.owner.getRoleOf("co_zoppoxWWJaHYKPgSgUkuCCXQX21")) {
      console.log("Adding worker");
      co.group()
        .load("co_zoppoxWWJaHYKPgSgUkuCCXQX21")
        .then((regardeProfileWorkerGroup) => {
          if (!regardeProfileWorkerGroup) {
            console.debug("No public group");
            return;
          }

          regardeAuth.$jazz.owner.addMember(
            regardeProfileWorkerGroup,
            "writer",
          );

          console.log("Regarde-dev worker added to Auth Token");
        });
    }
  });
