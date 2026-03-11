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
      account.$jazz.set(
        "profile",
        co.profile().create({ name: "Regarde User" }, publicGroup),
      );
    }

    const hasRoot = account.$jazz.has("root") === true;
    if (hasRoot === false) {
      const regardeSdk = await initRegardeSDK(account, "create");
      account.$jazz.set("root", {
        "regarde-sdk": regardeSdk,
      });
      console.info(
        "RegardeAccount root initialized with RegardeSDK:",
        regardeSdk.$jazz.id,
      );
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
      console.info(
        "[SUCCESS] RegardeSDK initialized and synced:",
        regardeSDK.$jazz.id,
      );
    } else {
      let regardeSDK = root["regarde-sdk"] as co.loaded<typeof RegardeSDK>;

      // v2 is deprecated - fully recreate as v4
      const isRegardeSdkV2 =
        regardeSDK !== null &&
        regardeSDK.$isLoaded === true &&
        regardeSDK.version < 3;
      if (isRegardeSdkV2 === true) {
        console.warn("[DEPRECATION] v2 SDK detected. Recreating as v4...");
        regardeSDK = await initRegardeSDK(account, "create");
        root.$jazz.set("regarde-sdk", regardeSDK);
        await account.$jazz.waitForSync();
        console.info(
          "[SUCCESS] RegardeSDK recreated as v4:",
          regardeSDK.$jazz.id,
        );
      } else {
        const isRegardeSdkV3 =
          regardeSDK !== null &&
          regardeSDK.$isLoaded === true &&
          regardeSDK.version === 3;
        if (isRegardeSdkV3 === true) {
        // Migration v3 -> v4: Add mySubscriptions and myLicenses if missing
        const ownerGroup = regardeSDK.$jazz.owner;
        const isOwnerGroupValid =
          ownerGroup !== null && ownerGroup.$isLoaded === true;

        if (isOwnerGroupValid === false) {
          throw new Error("Failed to load SDK owner group for migration");
        }

        // Ensure myPayments is loaded to get the regardeAdminOtherReadersGroup
        await regardeSDK.$jazz.ensureLoaded({
          resolve: {
            myPayments: true,
          },
        });

        const myPayments = regardeSDK.myPayments;
        const isMyPaymentsLoaded =
          myPayments !== null && myPayments.$isLoaded === true;

        if (isMyPaymentsLoaded === false) {
          throw new Error("Failed to load myPayments for migration");
        }

        // Get the admin group from myPayments (they share the same owner)
        const adminGroup = myPayments.$jazz.owner;
        const isAdminGroupValid =
          adminGroup !== null && adminGroup.$isLoaded === true;

        if (isAdminGroupValid === false) {
          throw new Error("Failed to load admin group for migration");
        }

        // Check if mySubscriptions is missing
        const hasMySubscriptions = regardeSDK.$jazz.has("mySubscriptions");

        if (hasMySubscriptions === false) {
          // Create mySubscriptions structure
          const allSubscriptionsRecord = co
            .record(z.string(), z.string())
            .create({}, { owner: adminGroup });
          await allSubscriptionsRecord.$jazz.waitForSync();

          const byAppSubscriptionsRecord = co
            .record(z.string(), co.record(z.string(), z.string()))
            .create({}, { owner: adminGroup });
          await byAppSubscriptionsRecord.$jazz.waitForSync();

          const subscriptionStatusRecord = co
            .record(z.string(), z.string())
            .create({}, { owner: adminGroup });
          await subscriptionStatusRecord.$jazz.waitForSync();

          const mySubscriptions = co
            .map({
              all: co.record(z.string(), z.string()),
              byApp: co.record(z.string(), co.record(z.string(), z.string())),
              status: co.record(z.string(), z.string()),
            })
            .create(
              {
                all: allSubscriptionsRecord,
                byApp: byAppSubscriptionsRecord,
                status: subscriptionStatusRecord,
              },
              { owner: adminGroup },
            );
          await mySubscriptions.$jazz.waitForSync();

          regardeSDK.$jazz.set("mySubscriptions", mySubscriptions);
          console.info(
            "[MIGRATION] Created mySubscriptions:",
            mySubscriptions.$jazz.id,
          );
        }

        // Check if myLicenses is missing
        const hasMyLicenses = regardeSDK.$jazz.has("myLicenses");

        if (hasMyLicenses === false) {
          // Create myLicenses structure
          const allLicensesRecord = co
            .record(z.string(), z.string())
            .create({}, { owner: adminGroup });
          await allLicensesRecord.$jazz.waitForSync();

          const byAppLicensesRecord = co
            .record(z.string(), co.record(z.string(), z.string()))
            .create({}, { owner: adminGroup });
          await byAppLicensesRecord.$jazz.waitForSync();

          const myLicenses = co
            .map({
              all: co.record(z.string(), z.string()),
              byApp: co.record(z.string(), co.record(z.string(), z.string())),
            })
            .create(
              {
                all: allLicensesRecord,
                byApp: byAppLicensesRecord,
              },
              { owner: adminGroup },
            );
          await myLicenses.$jazz.waitForSync();

          regardeSDK.$jazz.set("myLicenses", myLicenses);
          console.info("[MIGRATION] Created myLicenses:", myLicenses.$jazz.id);
        }

        // Update version to 4
        regardeSDK.$jazz.set("version", 4);
        await regardeSDK.$jazz.waitForSync();
        console.info("[SUCCESS] RegardeSDK migrated to v4");
        }
      }
    }
  });

/** Loaded RegardeAccount instance */
export type TRegardeAccount = co.loaded<typeof RegardeAccount>;
