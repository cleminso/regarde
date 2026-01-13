import { co, CoValueClass, Loaded } from "jazz-tools";

/**
 * Ensures that the Regarde Worker has the correct permissions (writer role) on a given CoValue.
 *
 * This is a "repair" utility. Under normal circumstances, `initRegardeSDK` creates data
 * with the correct group permissions pre-configured. Use this function if you need to
 * retroactive grant access to data that was created without the shared group.
 *
 * @param coValue - The loaded CoValue to check and repair permissions for.
 */
export const addRegardePermissions = async (
  coValue: Loaded<CoValueClass>,
): Promise<void> => {
  const owner = coValue.$jazz.owner;
  const ownerLoaded =
    owner !== null && owner !== undefined && owner.$isLoaded === true;
  if (ownerLoaded === false) {
    console.error(
      `[ERROR] No owner found for coValue ${coValue.$jazz.id}. Fix by: (1) Checking if CoValue.create() was called with proper owner parameter, (2) Verifying account initialization sequence in your application`,
    );
    // TODO: Create group with worker

    throw new Error(`There are no owner for this coValue ${coValue.$jazz.id}`, {
      cause: new Error("Owner is undefined"),
    });
  }

  const workerId = process.env.REGARDE_REGISTRY_WORKER;
  if (workerId === undefined || workerId === null || workerId === "") {
    throw new Error(
      "[ERROR] Missing required environment variable: REGARDE_REGISTRY_WORKER. Please check your .env file.",
    );
  }
  const workerRole = owner.getRoleOf(workerId);
  const workerAlreadyMember = workerRole !== null && workerRole !== undefined;
  if (workerAlreadyMember === true) {
    return;
  }

  console.log("[INFO] Adding worker account to coValue", coValue.$jazz.id);

  const regardeProfileWorkerGroup = await co.group().load(workerId, {});

  const workerGroupLoaded = regardeProfileWorkerGroup.$isLoaded === true;
  if (workerGroupLoaded === false) {
    console.error(
      "[ERROR] Failed to add worker to coValue. Fix by: (1) Checking if Regarde environment is initialized, (2) Verifying network connection to Jazz network, (3) Confirming worker account accessibility",
    );
    return;
  }

  owner.addMember(regardeProfileWorkerGroup, "writer");
  await owner.$jazz.waitForSync();

  console.log("[SUCCESS] Regarde worker added to coValue", coValue.$jazz.id);
};
