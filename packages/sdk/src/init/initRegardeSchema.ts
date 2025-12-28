import { co, Group } from "jazz-tools";
import { RegardeSDK, RegardeAuth } from "../auth/schemas/auth";
import { UserHandle } from "../regarde-users";
import { PaymentManager, ListOfPaymentEvents, App } from "../payments/schemas";
import { getRegardeAuth } from "../auth/refreshAuthToken";
import { RegardeAccount } from "../auth/schemas/regardeAccount";
import { z } from "zod";

export interface InitRegardeSchemaOptions {
  skipRefreshToken?: boolean;
  skipSetInRoot?: boolean;
}

export const initRegardeSchema = async (
  account: co.loaded<typeof RegardeAccount>,
  options?: InitRegardeSchemaOptions,
): Promise<co.loaded<typeof RegardeSDK>> => {
  const skipRefreshToken = options?.skipRefreshToken ?? false;

  if (!account || !account.$isLoaded) {
    throw new Error("Account must be loaded before calling initRegardeSchema");
  }

  try {
    // Load account with explicit root resolution so the structure is known
    const { root } = await account.$jazz.ensureLoaded({
      resolve: {
        root: {
          "regarde-sdk": true,
        },
      },
    });

    if (!root.$isLoaded) {
      throw new Error("Account root not loaded");
    }

    const regardeSDK = root["regarde-sdk"];

    // Check if RegardeSDK needs initialization
    if (!regardeSDK || !regardeSDK.$isLoaded) {
      console.info(
        "[INFO] RegardeSDK not found or incomplete. Initializing...",
      );

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
              token: "not-valid-yet-" + Math.random(),
              expiresAt: 0,
            },
            {
              owner: userGroup,
            },
          ),
          myApps: co.list(App).create([], { owner: userGroup }),
          myPayments: PaymentManager.create(
            {
              allMyPayments: ListOfPaymentEvents.create([], {
                owner: userGroup,
              }),
              paymentHistoryByApp: co
                .record(z.string(), ListOfPaymentEvents)
                .create({}, { owner: userGroup }),
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

      if (!options?.skipSetInRoot) {
        root.$jazz.set("regarde-sdk", newSDK);
        await newSDK.$jazz.waitForSync();
        await account.$jazz.waitForSync();

        console.info(
          "[SUCCESS] RegardeSDK initialized, set in account root, and synced",
        );
      }

      return newSDK;
    }

    await regardeSDK.$jazz.ensureLoaded({
      resolve: {
        auth: true,
      },
    });

    if (!regardeSDK.auth?.$isLoaded) {
      throw new Error("RegardeSDK auth not properly loaded");
    }

    if (
      !regardeSDK.auth.$jazz.has("token") ||
      !regardeSDK.auth.$jazz.has("expiresAt")
    ) {
      throw new Error("RegardeSDK auth missing required fields");
    }

    if (!regardeSDK.auth.token.trim()) {
      throw new Error("RegardeSDK auth token is empty");
    }

    if (!skipRefreshToken) {
      const isExpired = Date.now() > regardeSDK.auth.expiresAt;
      if (isExpired) {
        console.info("[INFO] Authentication token expired, refreshing...");
        const newToken = await getRegardeAuth({
          loadedRegardeAuthCoMap: regardeSDK.auth,
        });
        if (!newToken) {
          throw new Error("Failed to refresh authentication token");
        }
      }

      await regardeSDK.auth.$jazz.waitForSync();
    }

    return regardeSDK;
  } catch (error: any) {
    throw new Error("Failed to init RegardeSDK", { cause: error });
  }
};
