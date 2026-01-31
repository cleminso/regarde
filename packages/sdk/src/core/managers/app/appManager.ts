import { co, z, Loaded, Group } from "jazz-tools";

import { useLogging } from "#core/logger";
import { RegardeAccount } from "#schemas/regardeAccount";
import { RegardeSDK } from "#schemas/regardeSDK";
import { App, type TApp } from "#schemas/regardeUserApp";

const logger = useLogging({
  module: import.meta.filename,
});

/**
 * Parameters for creating a new app
 */
export interface CreateAppParams {
  /** App name for display purposes */
  name: string;
  /** Optional description of app functionality */
  description?: string;
  /** App payment provider */
  paymentProvider: "lemonsqueezy" | "stripe";
}

/**
 * Creates a new app with payment configuration.
 *
 * Creates App CoMap with registry group access and stores it in
 * RegardeSDK.myApps list. Automatically handles group creation and sync.
 *
 * @param account - Loaded RegardeAccount instance (app owner)
 * @param appData - App configuration including name and payment provider
 * @returns Promise resolving to newly created App CoMap
 * @throws {Error} When registry group cannot be loaded or sync fails
 */
export const createApp = async (
  account: co.loaded<typeof RegardeAccount>,
  appData: CreateAppParams,
): Promise<TApp> => {
  const REGARDE_REGISTRY_GROUP = "co_zoppoxWWJaHYKPgSgUkuCCXQX21";

  const { root: accountRoot } = await account.$jazz.ensureLoaded({
    resolve: {
      root: {
        "regarde-sdk": true,
      },
    },
  });
  const { "regarde-sdk": regardeSdk } = accountRoot;

  const { myApps } = await accountRoot["regarde-sdk"].$jazz.ensureLoaded({
    resolve: {
      myApps: { $each: true },
    },
  });
  const isMyAppsLoaded = myApps !== null && myApps.$isLoaded === true;

  logger.debug({
    message: "create App object",
    data: {
      REGARDE_REGISTRY_GROUP,
      account: account.isMe,
      accountRoot: accountRoot.toJSON(), // only return object data without Jazz methods
      myApps: myApps.toJSON(),
      isMyAppsLoaded,
      regardeSdkJazzId: regardeSdk.$jazz.id,
    },
  });

  if (isMyAppsLoaded === false) {
    logger.debug({
      message: "myApps not loaded before app creation",
      data: {
        myAppsNull: myApps === null,
        myAppsLoaded: myApps?.$isLoaded,
      },
    });
    throw new Error("RegardeSDK.myApps must be loaded before calling createApp");
  }

  const regardeProfileWorkerGroup = await co.group().load(REGARDE_REGISTRY_GROUP, {
    loadAs: account,
  });
  const isGroupLoaded = regardeProfileWorkerGroup.$isLoaded === true;

  logger.debug({
    message: "regardeProfileWorkerGroup is loaded",
    data: {
      groupJazzId: regardeProfileWorkerGroup.$jazz.id,
      isGroupLoaded,
    },
  });

  if (isGroupLoaded === false) {
    throw new Error("regardeProfileWorkerGroup not loaded");
  }

  const userGroup = regardeSdk.$jazz.owner; // TODO: investigate where userGroup is from

  const regardeAdminOtherReadersGroup = Group.create({
    owner: account,
  });
  regardeAdminOtherReadersGroup.addMember(regardeProfileWorkerGroup, "admin");
  await regardeAdminOtherReadersGroup.$jazz.waitForSync();

  regardeAdminOtherReadersGroup.addMember(account, "reader");
  await regardeAdminOtherReadersGroup.$jazz.waitForSync();

  logger.debug({
    message: "regardeAdminOtherReadersGroup created",
    data: {
      groupJazzId: regardeAdminOtherReadersGroup.$jazz.id,
      directMembers: regardeAdminOtherReadersGroup.getDirectMembers(),
      allMembers: regardeAdminOtherReadersGroup.members,
      myRole: regardeAdminOtherReadersGroup.myRole,
    },
  });

  const newApp = App.create(
    {
      name: appData.name,
      description: appData.description || "",
      ownerAccountId: account.$jazz.id,
      paymentProvider: appData.paymentProvider,
      isEnabled: false,
      createdAt: Date.now(),
      metadata: {},
      webhookSecret: "",
      payments: co
        .map({
          all: co.record(z.string(), z.string()), // prefixedProviderEventUUID -> PaymentEvent.id
          byUser: co.record(z.string(), co.record(z.string(), z.string())), // JazzAccount.id -> prefixedProviderEventUUID -> PaymentEvent.id
        })
        .create(
          {
            all: {},
            byUser: {},
          },
          { owner: regardeAdminOtherReadersGroup },
        ),
    },
    { owner: userGroup },
  );

  await newApp.$jazz.waitForSync();

  myApps.$jazz.push(newApp);
  await myApps.$jazz.waitForSync();

  logger.debug({
    message: "Regarde App created",
    data: {
      regardeApp: newApp.toJSON(),
    },
  });

  return newApp;
};

/**
 * Returns array of user's apps.
 *
 * @param regardeSDK - Loaded RegardeSDK instance
 * @returns Array of loaded App CoMaps, empty array if none exist
 */
export const getMyApps = async (regardeSDK: Loaded<typeof RegardeSDK>): Promise<TApp[]> => {
  const myApps = regardeSDK.myApps;
  const myAppsValid = myApps !== null && myApps.$isLoaded === true;

  if (myAppsValid === false) {
    return [];
  }

  await myApps.$jazz.ensureLoaded({ resolve: { $each: true } });

  return Array.from(myApps).filter((app): app is TApp => app !== null && app.$isLoaded === true);
};

// To find my app no need new fucntions
// const myApps = await getMyApps(regardeSDK);
// const app = myApps.find(a => a.$jazz.id === appId);
