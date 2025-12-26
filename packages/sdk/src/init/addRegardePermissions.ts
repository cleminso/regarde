import { co, CoValueClass, Loaded } from "jazz-tools";

/**
 * Ensures that the Regarde Worker has the correct permissions (writer role) on a given CoValue.
 *
 * This is a "repair" utility. Under normal circumstances, `initRegardeSchema` creates data
 * with the correct group permissions pre-configured. Use this function if you need to
 * retroactive grant access to data that was created without the shared group.
 *
 * @param coValue - The loaded CoValue to check and repair permissions for.
 */
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
