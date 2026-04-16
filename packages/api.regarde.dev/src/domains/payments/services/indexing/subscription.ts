import { RegardeSDK, useLogging } from "@regarde-dev/core";

import type { TIndexEventInput, TIndexEventToAppInput, TIndexEventToUserInput } from "./types";

const logger = useLogging({
  module: import.meta.filename,
});

export const indexSubscriptionEvent = async ({
  eventId,
  prefixedProviderEventUUID,
  appId,
  jazzAccountId,
  regardeSDKId,
  app,
  worker,
}: TIndexEventInput): Promise<void> => {
  await indexSubscriptionEventToUser({
    eventId,
    prefixedProviderEventUUID,
    appId,
    regardeSDKId,
    worker,
  });

  await indexSubscriptionEventToApp({
    eventId,
    prefixedProviderEventUUID,
    jazzAccountId,
    app,
  });
};

const indexSubscriptionEventToUser = async ({
  eventId,
  prefixedProviderEventUUID,
  appId,
  regardeSDKId,
  worker,
}: TIndexEventToUserInput): Promise<void> => {
  const userSDK = await RegardeSDK.load(regardeSDKId, {
    loadAs: worker,
    resolve: {
      mySubscriptions: {
        all: { $each: true },
        byApp: { $each: true },
        status: { $each: true },
      },
    },
  });

  const isUserSDKLoaded = userSDK.$isLoaded === true;
  if (isUserSDKLoaded === false) {
    logger.error({
      message: "Failed to load user RegardeSDK for subscription indexing",
      data: { regardeSDKId },
    });
    return;
  }

  const { mySubscriptions } = await userSDK.$jazz.ensureLoaded({
    resolve: {
      mySubscriptions: {
        all: { $each: true },
        byApp: true,
      },
    },
  });

  if (mySubscriptions.all.$jazz.has(prefixedProviderEventUUID) === false) {
    mySubscriptions.all.$jazz.set(prefixedProviderEventUUID, eventId);
    await mySubscriptions.$jazz.waitForSync();
  }

  if (mySubscriptions.byApp.$jazz.has(appId) === false) {
    mySubscriptions.byApp.$jazz.set(appId, {
      [prefixedProviderEventUUID]: eventId,
    });
  } else if (mySubscriptions.byApp[appId].$jazz.has(prefixedProviderEventUUID) === false) {
    mySubscriptions.byApp[appId].$jazz.set(prefixedProviderEventUUID, eventId);
  }

  await mySubscriptions.$jazz.waitForSync();
};

const indexSubscriptionEventToApp = async ({
  eventId,
  prefixedProviderEventUUID,
  jazzAccountId,
  app,
}: TIndexEventToAppInput): Promise<void> => {
  const isAppSubscriptionsLoaded = app.subscriptions !== null && app.subscriptions.$isLoaded === true;
  if (isAppSubscriptionsLoaded === false) {
    logger.error({
      message: "App subscriptions not loaded for indexing",
      data: { appId: app.$jazz.id },
    });
    return;
  }

  const appSubscriptions = await app.subscriptions.$jazz.ensureLoaded({
    resolve: { all: { $each: true }, byUser: true },
  });
  const appSubscriptionsByUser = await appSubscriptions.byUser.$jazz.ensureLoaded({
    resolve: { $each: true },
  });

  if (appSubscriptions.all.$jazz.has(prefixedProviderEventUUID) === false) {
    appSubscriptions.all.$jazz.set(prefixedProviderEventUUID, eventId);
    await app.$jazz.waitForSync();
  }

  if (appSubscriptionsByUser.$jazz.has(jazzAccountId) === false) {
    appSubscriptionsByUser.$jazz.set(jazzAccountId, {
      [prefixedProviderEventUUID]: eventId,
    });
  } else if (
    appSubscriptionsByUser[jazzAccountId].$jazz.has(prefixedProviderEventUUID) === false
  ) {
    appSubscriptionsByUser[jazzAccountId].$jazz.set(prefixedProviderEventUUID, eventId);
  }

  await app.$jazz.waitForSync();
};
