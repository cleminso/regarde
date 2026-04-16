import { Group, Loaded } from "jazz-tools";

import { RegardeSDK, RegistryWorkerAccount, Subscription, useLogging } from "@regarde-dev/core";

import type { NormalizedEvent, NormalizedSubscriptionData } from "../../adapters";

const logger = useLogging({
  module: import.meta.filename,
});

type TManageSubscriptionStateInput = {
  normalized: NormalizedEvent;
  data: NormalizedSubscriptionData;
  subscriptionEventId: string;
  eventOwnerGroup: ReturnType<typeof Group.create>;
  jazzAccountId: string;
  appId: string;
  regardeSDKId: string;
  worker: Loaded<typeof RegistryWorkerAccount>;
};

export const manageSubscriptionState = async ({
  normalized,
  data,
  subscriptionEventId,
  eventOwnerGroup,
  jazzAccountId,
  appId,
  regardeSDKId,
  worker,
}: TManageSubscriptionStateInput): Promise<void> => {
  const userSDK = await RegardeSDK.load(regardeSDKId, {
    loadAs: worker,
    resolve: {
      mySubscriptions: {
        status: { $each: true },
      },
    },
  });

  if (userSDK.$isLoaded !== true) {
    logger.error({
      message: "Failed to load user SDK for subscription state management",
      data: { regardeSDKId },
    });
    return;
  }

  const { mySubscriptions } = await userSDK.$jazz.ensureLoaded({
    resolve: {
      mySubscriptions: {
        status: { $each: true },
      },
    },
  });

  const existingSubId = mySubscriptions.status[data.providerSubscriptionId];
  const hasExistingSubId =
    existingSubId !== undefined && existingSubId !== null && existingSubId !== "";
  const isSubscriptionCreatedEvent = normalized.eventType === "subscription.created";

  if (hasExistingSubId === true && isSubscriptionCreatedEvent === false) {
    const existingSub = await Subscription.load(existingSubId, {
      loadAs: worker,
    });

    if (existingSub.$isLoaded !== true) {
      logger.error({
        message: "Failed to load existing Subscription for update",
        data: {
          existingSubId,
          providerSubscriptionId: data.providerSubscriptionId,
        },
      });
      return;
    }

    existingSub.$jazz.set("status", data.status);
    existingSub.$jazz.set("lastSubscriptionEventId", subscriptionEventId);
    existingSub.$jazz.set("updatedAt", normalized.timestamp);

    const currentPeriodStart = data.currentPeriodStart;
    const hasCurrentPeriodStart = currentPeriodStart !== undefined;
    if (hasCurrentPeriodStart === true) {
      existingSub.$jazz.set("currentPeriodStart", currentPeriodStart);
    }
    const currentPeriodEnd = data.currentPeriodEnd;
    const hasCurrentPeriodEnd = currentPeriodEnd !== undefined;
    if (hasCurrentPeriodEnd === true) {
      existingSub.$jazz.set("currentPeriodEnd", currentPeriodEnd);
    }
    const planId = data.planId;
    const hasPlanId = planId !== undefined;
    if (hasPlanId === true) {
      existingSub.$jazz.set("planId", planId);
    }
    const cancelAtPeriodEnd = data.cancelAtPeriodEnd;
    const hasCancelAtPeriodEnd = cancelAtPeriodEnd !== undefined;
    if (hasCancelAtPeriodEnd === true) {
      existingSub.$jazz.set("cancelAtPeriodEnd", cancelAtPeriodEnd);
    }
    const isSubscriptionCanceledEvent = normalized.eventType === "subscription.canceled";
    if (isSubscriptionCanceledEvent === true) {
      existingSub.$jazz.set("canceledByEventId", subscriptionEventId);
    }

    await existingSub.$jazz.waitForSync();
    return;
  }

  const subscription = Subscription.create(
    {
      appId,
      userAccountId: jazzAccountId,
      provider: normalized.provider,
      providerSubscriptionId: data.providerSubscriptionId,
      createdByEventId: subscriptionEventId,
      lastSubscriptionEventId: subscriptionEventId,
      status: data.status,
      currentPeriodStart: data.currentPeriodStart ?? normalized.timestamp,
      currentPeriodEnd: data.currentPeriodEnd ?? normalized.timestamp,
      planId: data.planId ?? "",
      cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
      createdAt: normalized.timestamp,
      updatedAt: normalized.timestamp,
    },
    { owner: eventOwnerGroup },
  );

  await subscription.$jazz.waitForSync();

  mySubscriptions.status.$jazz.set(data.providerSubscriptionId, subscription.$jazz.id);
  await mySubscriptions.$jazz.waitForSync();
};

export const updateSubscriptionFromPayment = async ({
  paymentEventId,
  providerSubscriptionId,
  regardeSDKId,
  worker,
}: {
  paymentEventId: string;
  providerSubscriptionId: string;
  regardeSDKId: string;
  worker: Loaded<typeof RegistryWorkerAccount>;
}): Promise<void> => {
  const userSDK = await RegardeSDK.load(regardeSDKId, {
    loadAs: worker,
    resolve: {
      mySubscriptions: {
        status: { $each: true },
      },
    },
  });

  if (userSDK.$isLoaded !== true) {
    return;
  }

  const { mySubscriptions } = await userSDK.$jazz.ensureLoaded({
    resolve: { mySubscriptions: { status: { $each: true } } },
  });

  const existingSubId = mySubscriptions.status[providerSubscriptionId];
  const hasExistingSubId =
    existingSubId !== undefined && existingSubId !== null && existingSubId !== "";

  if (hasExistingSubId === false) {
    return;
  }

  const existingSub = await Subscription.load(existingSubId, {
    loadAs: worker,
  });

  if (existingSub.$isLoaded !== true) {
    return;
  }

  existingSub.$jazz.set("lastPaymentEventId", paymentEventId);
  existingSub.$jazz.set("updatedAt", Date.now());
  await existingSub.$jazz.waitForSync();
};
