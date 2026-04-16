import { RegardeSDK, useLogging } from "@regarde-dev/core";

import type { TIndexEventInput, TIndexEventToAppInput, TIndexEventToUserInput } from "./types";

const logger = useLogging({
  module: import.meta.filename,
});

export const indexPaymentEvent = async ({
  eventId,
  prefixedProviderEventUUID,
  appId,
  jazzAccountId,
  regardeSDKId,
  app,
  worker,
}: TIndexEventInput): Promise<void> => {
  await indexPaymentEventToUser({
    eventId,
    prefixedProviderEventUUID,
    appId,
    regardeSDKId,
    worker,
  });

  await indexPaymentEventToApp({
    eventId,
    prefixedProviderEventUUID,
    jazzAccountId,
    app,
  });
};

const indexPaymentEventToUser = async ({
  eventId,
  prefixedProviderEventUUID,
  appId,
  regardeSDKId,
  worker,
}: TIndexEventToUserInput): Promise<void> => {
  const userSDK = await RegardeSDK.load(regardeSDKId, {
    loadAs: worker,
    resolve: {
      myPayments: {
        all: { $each: true },
        byApp: { $each: true },
      },
    },
  });

  const isUserSDKLoaded = userSDK.$isLoaded === true;
  if (isUserSDKLoaded === false) {
    logger.error({
      message: "Failed to load user RegardeSDK for payment indexing",
      data: { regardeSDKId },
    });
    return;
  }

  const { myPayments } = await userSDK.$jazz.ensureLoaded({
    resolve: {
      myPayments: {
        all: { $each: true },
        byApp: true,
      },
    },
  });

  if (myPayments.all.$jazz.has(prefixedProviderEventUUID) === false) {
    myPayments.all.$jazz.set(prefixedProviderEventUUID, eventId);
    await myPayments.$jazz.waitForSync();
  }

  if (myPayments.byApp.$jazz.has(appId) === false) {
    myPayments.byApp.$jazz.set(appId, {
      [prefixedProviderEventUUID]: eventId,
    });
  } else if (myPayments.byApp[appId].$jazz.has(prefixedProviderEventUUID) === false) {
    myPayments.byApp[appId].$jazz.set(prefixedProviderEventUUID, eventId);
  }

  await myPayments.$jazz.waitForSync();
};

const indexPaymentEventToApp = async ({
  eventId,
  prefixedProviderEventUUID,
  jazzAccountId,
  app,
}: TIndexEventToAppInput): Promise<void> => {
  const isAppPaymentsLoaded = app.payments !== null && app.payments.$isLoaded === true;
  if (isAppPaymentsLoaded === false) {
    logger.error({
      message: "App payments not loaded for indexing",
      data: { appId: app.$jazz.id },
    });
    return;
  }

  const appPayments = await app.payments.$jazz.ensureLoaded({
    resolve: { all: { $each: true }, byUser: true },
  });
  const appPaymentsByUser = await appPayments.byUser.$jazz.ensureLoaded({
    resolve: { $each: true },
  });

  if (appPayments.all.$jazz.has(prefixedProviderEventUUID) === false) {
    appPayments.all.$jazz.set(prefixedProviderEventUUID, eventId);
    await app.$jazz.waitForSync();
  }

  if (appPaymentsByUser.$jazz.has(jazzAccountId) === false) {
    appPaymentsByUser.$jazz.set(jazzAccountId, {
      [prefixedProviderEventUUID]: eventId,
    });
  } else if (appPaymentsByUser[jazzAccountId].$jazz.has(prefixedProviderEventUUID) === false) {
    appPaymentsByUser[jazzAccountId].$jazz.set(prefixedProviderEventUUID, eventId);
  }

  await app.$jazz.waitForSync();
};
