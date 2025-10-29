import { co, CoValue, z } from "jazz-tools";

/**
 * # RegardeAuth - Temporary authentication tokens for API requests
 *
 * ## Purpose
 * - Stores 24-hour expiring tokens for stateless API authentication
 * - Stored in account.root["api.regarde.dev"]
 *
 * ## Flow
 * 1. User generates token via SDK (useRegardeAuth hook)
 * 2. User sends token in headers: X-Regarde-Token, X-Regarde-Token-Id
 * 3. Worker loads RegardeAuth CoMap using token ID
 * 4. Worker verifies user owns token (no session storage needed)
 *
 * ## Migration
 * - Adds worker (co_zoppoxWWJaHYKPgSgUkuCCXQX21) with "writer" permissions
 * - Worker needs access to validate tokens belong to requesting user
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

export type RegardeAuthLoaded = co.loaded<typeof RegardeAuth>;

export const addWorkerToGroup = (coValue: CoValue) => {
  if (!coValue.$jazz.owner) {
    // TODO: Create group with worker
  } else if (
    coValue.$jazz.owner &&
    !coValue.$jazz.owner.getRoleOf("co_zoppoxWWJaHYKPgSgUkuCCXQX21")
  ) {
    // TODO: Add worker to group
    co.group()
      .load("co_zoppoxWWJaHYKPgSgUkuCCXQX21")
      .then((regardeProfileWorkerGroup) => {
        if (!regardeProfileWorkerGroup) {
          console.debug("No public group");
          return;
        }

        console.log("Group", regardeProfileWorkerGroup);

        coValue.$jazz.owner?.addMember(regardeProfileWorkerGroup, "writer");

        console.log("Regarde-dev worker added to Auth Token");
      })
      .catch((error) => {
        console.error(
          "Couldn't udpate the worker in regardeAuth coValue",
          error,
        );
      });
  }
};
