import { Account, co, CoValueClass, Group, Loaded, z } from "jazz-tools";
import { UserHandle } from "../../regarde-users";
import { PaymentManager } from "../../payments/schemas";

/**
 * # RegardeAuth - Provides temporary authentication tokens for API requests
 *
 * ## Purpose
 * - Stores 24-hour expiring tokens for stateless API authentication
 * - Stored in account.root["api.regarde.dev"]
 *
 * ## Flow
 * 1. SDK generates token via useRegardeAuth hook
 * 2. Client sends token to server in headers: X-Regarde-Token, X-Regarde-Token-Id
 * 3. Worker loads RegardeAuth CoMap using token ID (has write permission)
 * 4. Worker verifies user owns token (no session storage needed)
 *
 * ## Migration
 * - User adds worker (co_zoppoxWWJaHYKPgSgUkuCCXQX21) with "writer" permissions
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
      regardeAuth.$jazz.set("token", "not-valid-" + Math.random());
    }

    if (!regardeAuth.$jazz.has("expiresAt")) {
      regardeAuth.$jazz.set("expiresAt", 0);
    }
  });

export type RegardeAuthLoaded = co.loaded<typeof RegardeAuth>;

/**
 * Container schema for all Regarde SDK components
 *
 * - userHandle - User's profile and nickname data
 *
 * - auth - Authentication token for API requests
 *
 * - payments - Payment manager for subscriptions and transactions
 *
 * - version - Schema version for migration tracking
 */
export const RegardeSDK = co.map({
  userHandle: UserHandle,
  auth: RegardeAuth,
  payments: PaymentManager,
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

  if (!regardeProfileWorkerGroup.$isLoaded) {
    console.error(
      "[ERROR] No public group found. Check: (1) Network connectivity, (2) Worker account ID is correct: co_zoppoxWWJaHYKPgSgUkuCCXQX21, (3) Jazz network is accessible from your environment",
    );
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
      payments: PaymentManager.create(
        {
          version: 1,
        },
        {
          owner: userGroup,
        },
      ),
      version: 2,
    },
    {
      owner: userGroup,
    },
  );
};

export const addRegardePermissions = (coValue: Loaded<CoValueClass>) => {
  if (!coValue.$jazz.owner?.$isLoaded) {
    console.error(
      `[ERROR] No owner found for coValue ${coValue.$jazz.id}. Fix by: (1) Checking if CoValue.create() was called with proper owner parameter, (2) Verifying account initialization sequence in your application`,
    );
    // TODO: Create group with worker

    throw new Error(`There are no owner for this coValue ${coValue.$jazz.id}`, {
      cause: new Error("Owner is undefined"),
    });
  }

  if (!coValue.$jazz.owner?.getRoleOf("co_zoppoxWWJaHYKPgSgUkuCCXQX21")) {
    console.log("[INFO] Adding worker account to coValue", coValue.$jazz.id);

    co.group()
      .load("co_zoppoxWWJaHYKPgSgUkuCCXQX21", {})
      .then((regardeProfileWorkerGroup) => {
        if (!regardeProfileWorkerGroup.$isLoaded) {
          console.error(
            "[ERROR] Failed to add worker to coValue. Fix by: (1) Checking if Regarde environment is initialized, (2) Verifying network connection to Jazz network, (3) Confirming worker account accessibility",
          );
          return;
        }

        coValue.$jazz.owner?.addMember(regardeProfileWorkerGroup, "writer");

        console.log(
          "[SUCCESS] Regarde.dev Account added to UserHandle",
          coValue.$jazz.id,
        );
      });
  }
};
