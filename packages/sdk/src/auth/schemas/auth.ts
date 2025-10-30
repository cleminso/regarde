import { Account, co, CoMap, CoValueClass, Group, Loaded, z } from "jazz-tools";
import { UserHandle } from "../../regarde-users";

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
  });

export type RegardeAuthLoaded = co.loaded<typeof RegardeAuth>;

export const RegardeSDK = co.map({
  userHandle: UserHandle,
  auth: RegardeAuth,
  version: z.number().default(0),
});

export const initRegardeSchema = async (
  account: Account,
): Promise<co.loaded<typeof RegardeSDK>> => {
  const regardeProfileWorkerGroup = await co
    .group()
    .load("co_zoppoxWWJaHYKPgSgUkuCCXQX21", {
      loadAs: account,
    });

  // (:
  if (!regardeProfileWorkerGroup) {
    console.debug("No public group");
    throw new Error("Group not available");
  }

  const userGroup = Group.create({
    owner: account,
  });
  userGroup.addMember(regardeProfileWorkerGroup as Group, "writer");

  await userGroup.$jazz.waitForSync();

  return RegardeSDK.create(
    {
      userHandle: UserHandle.create(
        {
          nickname: "not-yet",
          registeredAt: 0,
          lastModified: 0,
          isActive: false,
        },
        {
          owner: userGroup,
        },
      ),
      auth: RegardeAuth.create(
        {
          token: "not-valid-yet-" + Math.random(),
          expiresAt: 0,
        },
        {
          owner: userGroup,
        },
      ),
      version: 1,
    },
    {
      owner: userGroup,
    },
  );
};

export const addRegardePermissions = (coValue: Loaded<CoValueClass>) => {
  if (!coValue.$jazz.owner) {
    // TODO: Create group with worker

    throw new Error(`There are no owner for this coValue ${coValue.$jazz.id}`, {
      cause: new Error("Owner is undefined"),
    });
  }

  if (!coValue.$jazz.owner?.getRoleOf("co_zoppoxWWJaHYKPgSgUkuCCXQX21")) {
    console.debug("Adding worker account to coValue", {
      coValueId: coValue.$jazz.id,
    });

    co.group()
      .load("co_zoppoxWWJaHYKPgSgUkuCCXQX21", {})
      .then((regardeProfileWorkerGroup) => {
        if (!regardeProfileWorkerGroup) {
          console.debug("No public group");
          return;
        }

        debugger;
        coValue.$jazz.owner?.addMember(regardeProfileWorkerGroup, "writer");

        console.log("Regarde.dev Account added to UserHandle");
      });
  }
};
