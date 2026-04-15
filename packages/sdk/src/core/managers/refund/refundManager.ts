import { co, z } from "jazz-tools";

import { RegardeError, REGARDE_ERROR_CODES } from "#core/errors";
import { createStripeRefund, createPolarRefund } from "#core/providers";
import type { TPaymentEvent } from "#schemas/paymentEvent";
import type { TPaymentProvider } from "#schemas/paymentEvent";
import { Refund, type TRefund } from "#schemas/refund";
import type { TRegardeAccount } from "#schemas/regardeAccount";
import type { TRegardeApp } from "#schemas/regardeUserApp";

export interface TCreateRefundOptions {
  paymentEvent: TPaymentEvent;
  app: TRegardeApp;
  amount?: number;
  reason?: string;
  metadata?: Record<string, string>;
}

export interface TCreateRefundReturn {
  refund: TRefund;
}

/**
 * Creates a refund for the given payment event.
 *
 * Flow:
 * 1. Creates Refund CoMap with status "pending"
 * 2. Calls provider API to create refund
 * 3. Updates Refund CoMap with provider refund ID
 * 4. Indexes refund in app's refunds
 *
 * @param account - The RegardeAccount creating the refund
 * @param apiKey - Provider API key (Stripe secret, Polar token)
 * @param provider - Payment provider
 * @param options - Refund creation options
 * @returns The created Refund CoMap
 */
export const createRefund = async (
  account: TRegardeAccount,
  apiKey: string,
  provider: TPaymentProvider,
  options: TCreateRefundOptions,
): Promise<TCreateRefundReturn> => {
  const isAccountLoaded = account !== null && account.$isLoaded === true;
  if (isAccountLoaded === false) {
    throw new RegardeError(
      "Account must be loaded to create refund",
      REGARDE_ERROR_CODES.ACCOUNT_NOT_LOADED,
    );
  }

  const isRootLoaded =
    account.root !== null && account.root !== undefined && account.root.$isLoaded === true;
  if (isRootLoaded === false) {
    throw new RegardeError("Account root must be loaded", REGARDE_ERROR_CODES.SDK_NOT_INITIALIZED);
  }

  const regardeSdk = account.root["regarde-sdk"];
  const isSdkLoaded =
    regardeSdk !== null && regardeSdk !== undefined && regardeSdk.$isLoaded === true;
  if (isSdkLoaded === false) {
    throw new RegardeError(
      "RegardeSDK must be initialized",
      REGARDE_ERROR_CODES.SDK_NOT_INITIALIZED,
    );
  }

  const paymentEvent = options.paymentEvent;
  const isPaymentLoaded =
    paymentEvent !== null && paymentEvent !== undefined && paymentEvent.$isLoaded === true;
  if (isPaymentLoaded === false) {
    throw new RegardeError("Payment event must be loaded", REGARDE_ERROR_CODES.COMAP_NOT_FOUND);
  }

  const app = options.app;
  const isAppLoaded = app !== null && app !== undefined && app.$isLoaded === true;
  if (isAppLoaded === false) {
    throw new RegardeError("App must be loaded", REGARDE_ERROR_CODES.COMAP_NOT_FOUND);
  }

  const refunds = app.refunds;
  const isRefundsLoaded = refunds !== null && refunds !== undefined && refunds.$isLoaded === true;
  if (isRefundsLoaded === false) {
    throw new RegardeError(
      "App refunds index must be loaded",
      REGARDE_ERROR_CODES.COMAP_NOT_FOUND,
    );
  }

  const ownerGroup = refunds.$jazz.owner;
  const isOwnerGroupLoaded =
    ownerGroup !== null && ownerGroup !== undefined && ownerGroup.$isLoaded === true;
  if (isOwnerGroupLoaded === false) {
    throw new RegardeError(
      "Failed to get app-scoped owner group for refund creation",
      REGARDE_ERROR_CODES.SYNC_FAILED,
    );
  }

  const jazzAccountId = account.$jazz.id;
  const appId = app.$jazz.id;
  const paymentEventId = paymentEvent.$jazz.id;

  // Validate amount doesn't exceed payment
  const paymentAmount = Number.parseInt(paymentEvent.amount, 10);
  const hasRefundAmount =
    paymentEvent.refundAmount !== undefined && paymentEvent.refundAmount !== null;
  const existingRefundAmount =
    hasRefundAmount === true ? Number.parseInt(paymentEvent.refundAmount, 10) : 0;
  const refundAmount = options.amount ?? paymentAmount;

  if (refundAmount > paymentAmount - existingRefundAmount) {
    throw new RegardeError(
      "Refund amount exceeds available payment amount",
      REGARDE_ERROR_CODES.REFUND_EXCEEDS_PAYMENT,
    );
  }

  const refund = Refund.create(
    {
      appId,
      userAccountId: jazzAccountId,
      paymentEventId,
      provider,
      status: "pending",
      amount: refundAmount,
      currency: paymentEvent.currency,
      reason: options.reason,
      createdAt: Date.now(),
      providerMetadata: {},
    },
    { owner: ownerGroup },
  );

  await refund.$jazz.waitForSync();

  const refundId = refund.$jazz.id;

  // Call provider API based on provider
  let providerResult;
  switch (provider) {
    case "stripe": {
      // Access providerMetadata record values directly
      // oxlint-disable-next-line no-unsafe-type-assertion
      const metadataRecord = paymentEvent.providerMetadata as unknown as Record<string, string>;
      const paymentIntentId = metadataRecord["stripe_payment_intent_id"];
      if (paymentIntentId === undefined || paymentIntentId === null) {
        throw new RegardeError(
          "Payment event missing stripe_payment_intent_id in providerMetadata",
          REGARDE_ERROR_CODES.MISSING_REQUIRED_FIELD,
          "stripe",
        );
      }
      providerResult = await createStripeRefund(apiKey, {
        paymentIntentId,
        amount: refundAmount,
        reason: options.reason,
        metadata: {
          regarde_refund_id: refundId,
          regarde_payment_event_id: paymentEventId,
          regarde_app_id: appId,
          ...options.metadata,
        },
      });
      break;
    }
    case "polar": {
      // Access providerMetadata record values directly
      // oxlint-disable-next-line no-unsafe-type-assertion
      const metadataRecord = paymentEvent.providerMetadata as unknown as Record<string, string>;
      const orderId = metadataRecord["polar_order_id"];
      if (orderId === undefined || orderId === null) {
        throw new RegardeError(
          "Payment event missing polar_order_id in providerMetadata",
          REGARDE_ERROR_CODES.MISSING_REQUIRED_FIELD,
          "polar",
        );
      }
      providerResult = await createPolarRefund(apiKey, {
        orderId,
        amount: refundAmount,
        reason: options.reason,
        metadata: {
          regarde_refund_id: refundId,
          regarde_payment_event_id: paymentEventId,
          regarde_app_id: appId,
          ...options.metadata,
        },
      });
      break;
    }
    default:
      throw new RegardeError(
        `Unsupported provider: ${provider as string}`,
        REGARDE_ERROR_CODES.PROVIDER_NOT_CONFIGURED,
      );
  }

  refund.$jazz.set("providerRefundId", providerResult.providerRefundId);
  await refund.$jazz.waitForSync();

  await indexRefund(app, refundId, providerResult.providerRefundId, jazzAccountId);

  return {
    refund,
  };
};

const indexRefund = async (
  app: TRegardeApp,
  refundId: string,
  providerRefundId: string,
  userAccountId: string,
): Promise<void> => {
  const refunds = app.refunds;
  const isRefundsLoaded = refunds !== null && refunds !== undefined && refunds.$isLoaded === true;

  if (isRefundsLoaded === false) {
    return;
  }

  const { all, byUser } = await refunds.$jazz.ensureLoaded({
    resolve: { all: true, byUser: true },
  });

  all.$jazz.set(providerRefundId, refundId);

  const userRefunds = byUser[userAccountId];
  const hasUserRefunds =
    userRefunds !== null && userRefunds !== undefined && userRefunds.$isLoaded === true;

  if (hasUserRefunds === true) {
    userRefunds.$jazz.set(providerRefundId, refundId);
  } else {
    const newUserRecord = co
      .record(z.string(), z.string())
      .create({ [providerRefundId]: refundId }, { owner: byUser.$jazz.owner });
    await newUserRecord.$jazz.waitForSync();
    byUser.$jazz.set(userAccountId, newUserRecord);
  }

  await refunds.$jazz.waitForSync();
};
