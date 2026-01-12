import { co, z, Loaded, Group, Account } from "jazz-tools";
import { App, type TApp } from "#schemas/regardeUserApp";
import { RegardeSDK } from "#schemas/regardeSDK";
import { RegardeAccount } from "#schemas/regardeAccount";

export interface CreateAppParams {
  name: string;
  description?: string;
  paymentProvider: "lemonsqueezy" | "stripe";
}

export const createApp = async (
  account: co.loaded<typeof RegardeAccount>,
  appData: CreateAppParams,
): Promise<TApp> => {
  console.log("createApp");

  const { root: accountRoot } = await account.$jazz.ensureLoaded({
    resolve: {
      root: {
        "regarde-sdk": true,
      },
    },
  });

  const { myApps } = await accountRoot["regarde-sdk"].$jazz.ensureLoaded({
    resolve: {
      myApps: { $each: true },
    },
  });

  const { "regarde-sdk": regardeSdk } = accountRoot;
  console.log("Account", account);
  console.log("myApps", myApps);

  const myAppsLoaded = myApps !== null && myApps.$isLoaded === true;
  if (myAppsLoaded === false) {
    throw new Error("RegardeSDK.myApps is not loaded");
  }

  const regardeProfileWorkerGroup = await co
    .group()
    .load("co_zoppoxWWJaHYKPgSgUkuCCXQX21", {
      loadAs: account,
    });

  const groupLoaded = regardeProfileWorkerGroup.$isLoaded === true;
  if (groupLoaded === false) {
    throw new Error("Group not available");
  }
  const userGroup = regardeSdk.$jazz.owner;

  const regardeAdminOtherReadersGroup = Group.create({
    owner: account,
  });
  regardeAdminOtherReadersGroup.addMember(regardeProfileWorkerGroup, "admin");
  regardeAdminOtherReadersGroup.addMember(account, "reader");

  await regardeAdminOtherReadersGroup.$jazz.waitForSync();

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

      // payments: {
      //   all: ListOfPaymentEvents.create([], { owner: userGroup }),
      //   byUser: co
      //     .record(z.string(), ListOfPaymentEvents)
      //     .create({}, { owner: userGroup }),
      // },
    },
    { owner: userGroup },
  );

  await newApp.$jazz.waitForSync();

  myApps.$jazz.push(newApp);
  await myApps.$jazz.waitForSync();

  return newApp;
};

export const getMyApps = async (
  regardeSDK: Loaded<typeof RegardeSDK>,
): Promise<TApp[]> => {
  const myApps = regardeSDK.myApps;
  const myAppsValid = myApps !== null && myApps.$isLoaded === true;

  if (myAppsValid === false) {
    return [];
  }

  await myApps.$jazz.ensureLoaded({ resolve: { $each: true } });

  return Array.from(myApps).filter(
    (app): app is TApp => app !== null && app.$isLoaded === true,
  );
};

// To find my app no need new fucntions
// const myApps = await getMyApps(regardeSDK);
// const app = myApps.find(a => a.$jazz.id === appId);
