import { co, z, Group } from "jazz-tools";

import { initRegardeSDK } from "#core/init";

import { RegardeSDK } from "./regardeSDK";

/**
 * Regarde account root structure.
 *
 * Contains RegardeSDK CoMap with all SDK components.
 */
export const RegardeRoot = co.map({
  "regarde-sdk": RegardeSDK,
});

/**
 * Regarde account schema.
 *
 * Extends Jazz account with Regarde SDK integration.
 * Initializes profile and RegardeSDK on first load.
 *
 * @schema
 * - `profile`: Public user profile (Group.owner = account)
 * - `root`: RegardeRoot CoMap containing SDK data
 */
export const RegardeAccount = co
  .account({
    profile: co.profile(),
    root: RegardeRoot,
  })
  .withMigration(async (account) => {
    const hasProfile = account.$jazz.has("profile") === true;
    if (hasProfile === false) {
      const publicGroup = Group.create({
        owner: account,
      });
      publicGroup.makePublic();
      account.$jazz.set("profile", co.profile().create({ name: "Regarde User" }, publicGroup));
    }

    const hasRoot = account.$jazz.has("root") === true;
    if (hasRoot === false) {
      const regardeSdk = await initRegardeSDK(account, "create");
      account.$jazz.set("root", {
        "regarde-sdk": regardeSdk,
      });
      console.info("RegardeAccount root initialized with RegardeSDK:", regardeSdk.$jazz.id);
    }

    await account.$jazz.waitForAllCoValuesSync();
    const { root } = await account.$jazz.ensureLoaded({
      resolve: {
        root: true,
      },
    });
    const isRootLoaded = root.$isLoaded === true;
    if (isRootLoaded === false) {
      throw new Error("Failed to load RegardeAccount root");
    }

    const hasRegardeSdk = root.$jazz.has("regarde-sdk") === true;
    if (hasRegardeSdk === false) {
      const regardeSDK = await initRegardeSDK(account, "create");
      root.$jazz.set("regarde-sdk", regardeSDK);
      await account.$jazz.waitForSync();
      console.info("[SUCCESS] RegardeSDK initialized and synced:", regardeSDK.$jazz.id);
    } else {
      // oxlint-disable-next-line no-unsafe-type-assertion -- Jazz CoValue access requires type assertion
      let regardeSDK = root["regarde-sdk"] as co.loaded<typeof RegardeSDK>;

      const isPreV5RegardeSdk =
        regardeSDK !== null && regardeSDK.$isLoaded === true && regardeSDK.version < 5;
      if (isPreV5RegardeSdk === true) {
        throw new Error(
          "Unsupported pre-v5 RegardeSDK detected. Create a new account.",
        );
      }
    }
  });

/** Loaded RegardeAccount instance */
export type TRegardeAccount = co.loaded<typeof RegardeAccount>;
