import { co, CoValue, Group } from "jazz-tools";
import { RegardeSDK } from "./regardeSDK";
import { initRegardeSDK } from "#core/init";

export const RegardeRoot = co.map({
  "regarde-sdk": RegardeSDK,
});

export const RegardeAccount = co
  .account({
    profile: co.profile(),
    root: RegardeRoot,
  })
  .withMigration(async (account) => {
    if (!account.$jazz.has("profile")) {
      const publicGroup = Group.create({
        owner: account,
      });
      publicGroup.makePublic();
      account.$jazz.set(
        "profile",
        co.profile().create({ name: "Regarde CLI User" }, publicGroup),
      );
    }

    if (!account.$jazz.has("root")) {
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
    if (!root.$isLoaded) {
      throw new Error("Failed to load RegardeAccount root");
    }

    if (!root.$jazz.has("regarde-sdk")) {
      const regardeSDK = await initRegardeSDK(account, "create");
      root.$jazz.set("regarde-sdk", regardeSDK);
      await account.$jazz.waitForSync();
      console.info(
        "[SUCCESS] RegardeSDK initialized and synced:",
        regardeSDK.$jazz.id,
      );
    } else {
      let regardeSDK = root["regarde-sdk"] as co.loaded<typeof RegardeSDK>;

      if (regardeSDK && regardeSDK.$isLoaded && regardeSDK.version < 2) {
        regardeSDK = await initRegardeSDK(account, "create");
        root.$jazz.set("regarde-sdk", regardeSDK);
        await account.$jazz.waitForSync();
        console.info("[SUCCESS] RegardeSDK migrated:", regardeSDK.$jazz.id);
      }
    }
  });
export type TRegardeAccount = co.loaded<typeof RegardeAccount>;
