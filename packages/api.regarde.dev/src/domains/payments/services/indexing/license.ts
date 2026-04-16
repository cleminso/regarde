import { RegardeSDK, useLogging } from "@regarde-dev/core";

import type { TIndexEventInput, TIndexEventToAppInput, TIndexEventToUserInput } from "./types";

const logger = useLogging({
  module: import.meta.filename,
});

export const indexLicenseEvent = async ({
  eventId,
  prefixedProviderEventUUID,
  appId,
  jazzAccountId,
  regardeSDKId,
  app,
  worker,
}: TIndexEventInput): Promise<void> => {
  await indexLicenseEventToUser({
    eventId,
    prefixedProviderEventUUID,
    appId,
    regardeSDKId,
    worker,
  });

  await indexLicenseEventToApp({
    eventId,
    prefixedProviderEventUUID,
    jazzAccountId,
    app,
  });
};

const indexLicenseEventToUser = async ({
  eventId,
  prefixedProviderEventUUID,
  appId,
  regardeSDKId,
  worker,
}: TIndexEventToUserInput): Promise<void> => {
  const userSDK = await RegardeSDK.load(regardeSDKId, {
    loadAs: worker,
    resolve: {
      myLicenses: {
        all: { $each: true },
        byApp: { $each: true },
      },
    },
  });

  const isUserSDKLoaded = userSDK.$isLoaded === true;
  if (isUserSDKLoaded === false ) {
    logger.error({
      message: "Failed to load user RegardeSDK for license indexing",
      data: { regardeSDKId },
    });
    return;
  }

  const { myLicenses } = await userSDK.$jazz.ensureLoaded({
    resolve: {
      myLicenses: {
        all: { $each: true },
        byApp: true,
      },
    },
  });

  if (myLicenses.all.$jazz.has(prefixedProviderEventUUID) === false) {
    myLicenses.all.$jazz.set(prefixedProviderEventUUID, eventId);
    await myLicenses.$jazz.waitForSync();
  }

  if (myLicenses.byApp.$jazz.has(appId) === false) {
    myLicenses.byApp.$jazz.set(appId, {
      [prefixedProviderEventUUID]: eventId,
    });
  } else if (myLicenses.byApp[appId].$jazz.has(prefixedProviderEventUUID) === false) {
    myLicenses.byApp[appId].$jazz.set(prefixedProviderEventUUID, eventId);
  }

  await myLicenses.$jazz.waitForSync();
};

const indexLicenseEventToApp = async ({
  eventId,
  prefixedProviderEventUUID,
  jazzAccountId,
  app,
}: TIndexEventToAppInput): Promise<void> => {
  const isAppLicensesLoaded = app.licenses !== null && app.licenses.$isLoaded === true;
  if (isAppLicensesLoaded === false) {
    logger.error({
      message: "App licenses not loaded for indexing",
      data: { appId: app.$jazz.id },
    });
    return;
  }

  const appLicenses = await app.licenses.$jazz.ensureLoaded({
    resolve: { all: { $each: true }, byUser: true },
  });
  const appLicensesByUser = await appLicenses.byUser.$jazz.ensureLoaded({
    resolve: { $each: true },
  });

  if (appLicenses.all.$jazz.has(prefixedProviderEventUUID) === false) {
    appLicenses.all.$jazz.set(prefixedProviderEventUUID, eventId);
    await app.$jazz.waitForSync();
  }

  if (appLicensesByUser.$jazz.has(jazzAccountId) === false) {
    appLicensesByUser.$jazz.set(jazzAccountId, {
      [prefixedProviderEventUUID]: eventId,
    });
  } else if (appLicensesByUser[jazzAccountId].$jazz.has(prefixedProviderEventUUID) === false) {
    appLicensesByUser[jazzAccountId].$jazz.set(prefixedProviderEventUUID, eventId);
  }

  await app.$jazz.waitForSync();
};
