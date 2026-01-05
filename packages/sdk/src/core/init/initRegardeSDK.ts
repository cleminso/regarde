import { co, z, Group } from "jazz-tools";
import { RegardeAuth } from "#schemas/regardeAuth";
import { RegardeAccount } from "#schemas/regardeAccount";
import { RegardeSDK } from "#schemas/regardeSDK";
import { UserHandle } from "#schemas/regardeUserHandle";
import { ListOfPaymentEvents } from "#schemas/paymentEvent";
import { App } from "#schemas/regardeUserApp";
import { getRegardeAuth } from "#managers/auth/refreshAuthToken";
import { generateRegardeToken } from "#managers/auth/generateToken";

export type InitRegardeSDKMode = "ensure" | "create";

export const initRegardeSDK = async (
  account: co.loaded<typeof RegardeAccount>,
  mode: InitRegardeSDKMode = "ensure",
): Promise<co.loaded<typeof RegardeSDK>> => {
  const accountValid = account !== null && account.$isLoaded === true;
  if (accountValid === false) {
    throw new Error("Account must be loaded before calling initRegardeSDK");
  }

  try {
    const { root } = await account.$jazz.ensureLoaded({
      resolve: {
        root: {
          "regarde-sdk": true,
        },
      },
    });

    const rootLoaded = root.$isLoaded === true;
    if (rootLoaded === false) {
      throw new Error("Account root not loaded");
    }

    const regardeSDK = root["regarde-sdk"];

    if (mode === "create") {
      const sdkLoaded = regardeSDK !== null && regardeSDK.$isLoaded === true;
      if (sdkLoaded === true) {
        return regardeSDK;
      }

      console.info(
        "[INFO] RegardeSDK not found or incomplete. Initializing...",
      );

      const regardeProfileWorkerGroup = await co
        .group()
        .load("co_zoppoxWWJaHYKPgSgUkuCCXQX21", {
          loadAs: account,
        });

      const groupLoaded = regardeProfileWorkerGroup.$isLoaded === true;
      if (groupLoaded === false) {
        throw new Error("Group not available");
      }

      const userGroup = Group.create({
        owner: account,
      });

      userGroup.addMember(account, "admin");
      userGroup.addMember(regardeProfileWorkerGroup as Group, "writer");

      await userGroup.$jazz.waitForSync();

      const newSDK = RegardeSDK.create(
        {
          myUserHandle: UserHandle.create(
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
              token: generateRegardeToken(),
              expiresAt: 0,
            },
            {
              owner: userGroup,
            },
          ),
          myApps: co.list(App).create([], { owner: userGroup }),
          myPayments: {
            all: ListOfPaymentEvents.create([], { owner: userGroup }),
            byApp: co
              .record(z.string(), ListOfPaymentEvents)
              .create({}, { owner: userGroup }),
          },
          version: 2,
        },
        {
          owner: userGroup,
        },
      );

      console.info("[INFO] RegardeSDK created");
      return newSDK;
    }

    const sdkValid = regardeSDK !== null && regardeSDK.$isLoaded === true;
    if (sdkValid === false) {
      console.info(
        "[INFO] RegardeSDK not found or incomplete. Initializing...",
      );

      const regardeProfileWorkerGroup = await co
        .group()
        .load("co_zoppoxWWJaHYKPgSgUkuCCXQX21", {
          loadAs: account,
        });

      const groupLoaded = regardeProfileWorkerGroup.$isLoaded === true;
      if (groupLoaded === false) {
        console.error(
          "[ERROR] No public group found. Check: (1) Network connectivity, (2) Worker account ID is correct: co_zoppoxWWJaHYKPgSgUkuCCXQX21, (3) Jazz network is accessible from your environment",
        );
        throw new Error("Group not available");
      }

      const userGroup = Group.create({
        owner: account,
      });

      userGroup.addMember(account, "admin");
      userGroup.addMember(regardeProfileWorkerGroup as Group, "writer");

      await userGroup.$jazz.waitForSync();

      const newSDK = RegardeSDK.create(
        {
          myUserHandle: UserHandle.create(
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
              token: generateRegardeToken(),
              expiresAt: 0,
            },
            {
              owner: userGroup,
            },
          ),
          myApps: co.list(App).create([], { owner: userGroup }),
          myPayments: {
            all: ListOfPaymentEvents.create([], { owner: userGroup }),
            byApp: co
              .record(z.string(), ListOfPaymentEvents)
              .create({}, { owner: userGroup }),
          },
          version: 2,
        },
        {
          owner: userGroup,
        },
      );

      root.$jazz.set("regarde-sdk", newSDK);
      await newSDK.$jazz.waitForSync();
      await account.$jazz.waitForSync();

      console.info(
        "[SUCCESS] RegardeSDK initialized, set in account root, and synced",
      );

      return newSDK;
    }

    await regardeSDK.$jazz.ensureLoaded({
      resolve: {
        auth: true,
        myApps: true,
        myUserHandle: true,
        myPayments: true,
      },
    });

    const authLoaded =
      regardeSDK.auth !== null && regardeSDK.auth.$isLoaded === true;
    if (authLoaded === false) {
      throw new Error("RegardeSDK auth not properly loaded");
    }

    const hasToken = regardeSDK.auth.$jazz.has("token") === true;
    const hasExpiresAt = regardeSDK.auth.$jazz.has("expiresAt") === true;
    const bothFieldsPresent = hasToken && hasExpiresAt;
    if (bothFieldsPresent === false) {
      throw new Error("RegardeSDK auth missing required fields");
    }

    const tokenValue = regardeSDK.auth.token;
    const tokenPresent = tokenValue !== null && tokenValue.length > 0;
    if (tokenPresent === false) {
      throw new Error("RegardeSDK auth token is empty");
    }

    const isExpired = Date.now() > regardeSDK.auth.expiresAt;
    if (isExpired === true) {
      console.info("[INFO] Authentication token expired, refreshing...");
      const newToken = await getRegardeAuth({
        loadedRegardeAuthCoMap: regardeSDK.auth,
      });
      const tokenReturned = newToken !== null;
      if (tokenReturned === false) {
        throw new Error("Failed to refresh authentication token");
      }
      await regardeSDK.auth.$jazz.waitForSync();
    }

    return regardeSDK;
  } catch (error: unknown) {
    throw new Error("Failed to init RegardeSDK", { cause: error });
  }
};
