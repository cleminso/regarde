import { co, Group, Loaded, z } from "jazz-tools";

import { useLogging } from "#core/logger";
import { RegardeAccount } from "#schemas/regardeAccount";
import { AppCheckoutSessionsSchema } from "#schemas/checkoutSession";
import { BlankGroup, Groups } from "#schemas/regardeGroups";
import { RegardeSDK } from "#schemas/regardeSDK";
import { AppRefundIndex } from "#schemas/refund";
import {
  AppLicenseIndex,
  AppPaymentIndex,
  AppSubscriptionIndex,
  RegardeApp,
  ListOfWebhooks,
  Profile,
  type TRegardeApp,
} from "#schemas/regardeUserApp";

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
}

/**
 * Creates a new app.
 *
 * Creates RegardeApp CoMap with empty webhooks list and registry group access.
 * User creates webhooks later via dashboard. Stores app in RegardeSDK.myApps list.
 *
 * @param account - Loaded RegardeAccount instance (app owner)
 * @param appData - App configuration (name, optional description)
 * @returns Promise resolving to newly created RegardeApp CoMap
 * @throws {Error} When registry group cannot be loaded or sync fails
 */
export const createApp = async (
  account: co.loaded<typeof RegardeAccount>,
  appData: CreateAppParams,
): Promise<TRegardeApp> => {
  const REGARDE_REGISTRY_GROUP = "co_zoppoxWWJaHYKPgSgUkuCCXQX21";

  const { root: accountRoot } = await account.$jazz.ensureLoaded({
    resolve: {
      root: {
        "regarde-sdk": true,
      },
    },
  });

  const { "regarde-sdk": regardeSdk } = accountRoot;

  const resolvedSdk = await regardeSdk.$jazz.ensureLoaded({
    resolve: {
      myApps: { $each: true },
      myPayments: true,
      mySubscriptions: true,
      myLicenses: true,
      auth: true,
    },
  });

  const myApps = resolvedSdk.myApps;
  const isMyAppsLoaded = myApps !== null && myApps.$isLoaded === true;

  logger.debug({
    message: "create App object",
    data: {
      REGARDE_REGISTRY_GROUP,
      account: account.isMe,
      accountRoot: accountRoot.toJSON(), // only return object data without Jazz methods
      myApps: myApps.toJSON(),
      isMyAppsLoaded,
      regardeSdkJazzId: resolvedSdk.$jazz.id,
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

  const adminGroup = Group.create({ owner: account, name: `${appData.name} - Admin` });
  const writeGroup = Group.create({ owner: account, name: `${appData.name} - Write` });
  const readerGroup = Group.create({ owner: account, name: `${appData.name} - Read` });
  const appOwnerGroup = Group.create({ owner: account, name: `${appData.name} - Owner` });

  appOwnerGroup.addMember(regardeProfileWorkerGroup, "reader");
  appOwnerGroup.addMember(adminGroup, "admin");
  appOwnerGroup.addMember(writeGroup, "writer");
  appOwnerGroup.addMember(readerGroup, "reader");

  await appOwnerGroup.$jazz.waitForSync();

  const appGroups = Groups.create(
    {
      adminGroup: BlankGroup.create({}, { owner: adminGroup }),
      writerGroup: BlankGroup.create({}, { owner: writeGroup }),
      readerGroup: BlankGroup.create({}, { owner: readerGroup }),
    },
    { owner: appOwnerGroup },
  );

  const regardeAdminOtherReadersGroup = Group.create({
    owner: account,
  });
  regardeAdminOtherReadersGroup.addMember(regardeProfileWorkerGroup, "admin");
  await regardeAdminOtherReadersGroup.$jazz.waitForSync();

  logger.debug({
    message: "regardeAdminOtherReadersGroup created",
    data: {
      groupJazzId: regardeAdminOtherReadersGroup.$jazz.id,
      directMembers: regardeAdminOtherReadersGroup.getDirectMembers(),
      allMembers: regardeAdminOtherReadersGroup.members,
      myRole: regardeAdminOtherReadersGroup.myRole(),
    },
  });

  const allPaymentsRecord = co.record(z.string(), z.string()).create({}, { owner: regardeAdminOtherReadersGroup });
  await allPaymentsRecord.$jazz.waitForSync();

  const byUserPaymentsRecord = co
    .record(z.string(), co.record(z.string(), z.string()))
    .create({}, { owner: regardeAdminOtherReadersGroup });
  await byUserPaymentsRecord.$jazz.waitForSync();

  const payments = AppPaymentIndex.create(
    {
      all: allPaymentsRecord,
      byUser: byUserPaymentsRecord,
    },
    { owner: regardeAdminOtherReadersGroup },
  );
  await payments.$jazz.waitForSync();

  const allSubscriptionsRecord = co.record(z.string(), z.string()).create({}, { owner: regardeAdminOtherReadersGroup });
  await allSubscriptionsRecord.$jazz.waitForSync();

  const byUserSubscriptionsRecord = co
    .record(z.string(), co.record(z.string(), z.string()))
    .create({}, { owner: regardeAdminOtherReadersGroup });
  await byUserSubscriptionsRecord.$jazz.waitForSync();

  const subscriptions = AppSubscriptionIndex.create(
    {
      all: allSubscriptionsRecord,
      byUser: byUserSubscriptionsRecord,
    },
    { owner: regardeAdminOtherReadersGroup },
  );
  await subscriptions.$jazz.waitForSync();

  const allLicensesRecord = co.record(z.string(), z.string()).create({}, { owner: regardeAdminOtherReadersGroup });
  await allLicensesRecord.$jazz.waitForSync();

  const byUserLicensesRecord = co
    .record(z.string(), co.record(z.string(), z.string()))
    .create({}, { owner: regardeAdminOtherReadersGroup });
  await byUserLicensesRecord.$jazz.waitForSync();

  const licenses = AppLicenseIndex.create(
    {
      all: allLicensesRecord,
      byUser: byUserLicensesRecord,
    },
    { owner: regardeAdminOtherReadersGroup },
  );
  await licenses.$jazz.waitForSync();

  const allCheckoutSessionsRecord = co.record(z.string(), z.string()).create({}, { owner: regardeAdminOtherReadersGroup });
  await allCheckoutSessionsRecord.$jazz.waitForSync();

  const byUserCheckoutSessionsRecord = co
    .record(z.string(), co.record(z.string(), z.string()))
    .create({}, { owner: regardeAdminOtherReadersGroup });
  await byUserCheckoutSessionsRecord.$jazz.waitForSync();

  const checkoutSessions = AppCheckoutSessionsSchema.create(
    {
      all: allCheckoutSessionsRecord,
      byUser: byUserCheckoutSessionsRecord,
    },
    { owner: regardeAdminOtherReadersGroup },
  );
  await checkoutSessions.$jazz.waitForSync();

  const allRefundsRecord = co.record(z.string(), z.string()).create({}, { owner: regardeAdminOtherReadersGroup });
  await allRefundsRecord.$jazz.waitForSync();

  const byUserRefundsRecord = co
    .record(z.string(), co.record(z.string(), z.string()))
    .create({}, { owner: regardeAdminOtherReadersGroup });
  await byUserRefundsRecord.$jazz.waitForSync();

  const refunds = AppRefundIndex.create(
    {
      all: allRefundsRecord,
      byUser: byUserRefundsRecord,
    },
    { owner: regardeAdminOtherReadersGroup },
  );
  await refunds.$jazz.waitForSync();

  const newApp = RegardeApp.create(
    {
      name: appData.name,
      ownerAccountId: account.$jazz.id,
      isEnabled: false,
      createdAt: Date.now(),
      providerMetadata: {},
      profile: Profile.create({}, { owner: appOwnerGroup }),
      webhooks: ListOfWebhooks.create([], { owner: appOwnerGroup }),
      payments: payments,
      subscriptions: subscriptions,
      licenses: licenses,
      refunds: refunds,
      checkoutSessions: checkoutSessions,
      groups: appGroups,
    },
    { owner: appOwnerGroup },
  );

  // TODO: frontside: newApp.groups.adminGroup.$jazz.owner.removeMember("co_z123");
  // TODO: create hooks to get group members list

  await newApp.$jazz.waitForSync();

  myApps.$jazz.push(newApp);
  await myApps.$jazz.waitForSync();

  regardeAdminOtherReadersGroup.addMember(account, "reader");

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
export const getMyApps = async (regardeSDK: Loaded<typeof RegardeSDK>): Promise<TRegardeApp[]> => {
  const myApps = regardeSDK.myApps;
  const myAppsValid = myApps !== null && myApps.$isLoaded === true;

  if (myAppsValid === false) {
    return [];
  }

  await myApps.$jazz.ensureLoaded({ resolve: { $each: true } });

  return Array.from(myApps).filter((app): app is TRegardeApp => {
    return (
      app !== null &&
      app !== undefined &&
      typeof app === "object" &&
      "$isLoaded" in app &&
      app.$isLoaded === true
    );
  });
};

// To find my app no need new fucntions
// const myApps = await getMyApps(regardeSDK);
// const app = myApps.find(a => a.$jazz.id === appId);
