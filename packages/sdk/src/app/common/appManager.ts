import { Loaded } from "jazz-tools";
import { App, type TApp } from "../../payments/schemas/payments";
import { RegardeSDK } from "../../auth/schemas/auth";

export const createApp = async (
  regardeSDK: Loaded<typeof RegardeSDK>,
  appData: {
    name: string;
    description?: string;
    paymentProvider: "lemonsqueezy" | "stripe";
  },
): Promise<TApp> => {
  await regardeSDK.$jazz.ensureLoaded({
    resolve: {
      myApps: true,
    },
  });

  const myApps = regardeSDK.myApps;
  const myAppsLoaded = myApps !== null && myApps.$isLoaded === true;
  if (myAppsLoaded === false) {
    throw new Error("RegardeSDK.myApps is not loaded");
  }

  const userGroup = regardeSDK.$jazz.owner;
  const ownerAccountId = userGroup.$jazz.id;

  const newApp = App.create(
    {
      name: appData.name,
      description: appData.description || "",
      ownerAccountId,
      paymentProvider: appData.paymentProvider,
      isEnabled: false,
      createdAt: Date.now(),
      metadata: {},
      webhookSecret: "",
      payments: [],
      paymentsByUser: {},
    },
    { owner: userGroup },
  );

  await newApp.$jazz.waitForSync();

  myApps.$jazz.push(newApp);
  await regardeSDK.$jazz.waitForSync();

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
